"""
WebSocket endpoints for real-time sync
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, Set, List
import json
import asyncio
from datetime import datetime
from app.models.user import User
from app.models.sync_event import SyncEvent
from app.services.event_service import emit_sync_event

router = APIRouter(tags=["websocket"])

# Store active connections per business
business_connections: Dict[int, Set[WebSocket]] = {}


class ConnectionManager:
    """Manages WebSocket connections per business"""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, business_id: int):
        """Connect a client to a business room"""
        await websocket.accept()
        
        if business_id not in self.active_connections:
            self.active_connections[business_id] = set()
        
        self.active_connections[business_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, business_id: int):
        """Disconnect a client from a business room"""
        if business_id in self.active_connections:
            self.active_connections[business_id].discard(websocket)
            if not self.active_connections[business_id]:
                del self.active_connections[business_id]
    
    async def broadcast_to_business(
        self,
        business_id: int,
        event_type: str,
        payload: dict,
        exclude_websocket: WebSocket = None
    ):
        """Broadcast an event to all clients in a business room"""
        if business_id not in self.active_connections:
            return
        
        message = {
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected = set()
        for websocket in self.active_connections[business_id]:
            if websocket == exclude_websocket:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                # Mark for removal if connection is dead
                disconnected.add(websocket)
        
        # Remove disconnected websockets
        for ws in disconnected:
            self.active_connections[business_id].discard(ws)


manager = ConnectionManager()


@router.websocket("/ws/{business_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    business_id: int,
    user_id: int = Query(...),
    device_id: str = Query(None)
):
    """
    WebSocket endpoint for real-time sync
    
    Clients connect to: ws://host/ws/{business_id}?user_id={id}&device_id={id}
    """
    await manager.connect(websocket, business_id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to real-time sync",
            "business_id": business_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Listen for incoming messages
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            msg_type = data.get("type")
            
            if msg_type == "ping":
                # Heartbeat
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif msg_type == "sync_event":
                # Client is emitting a sync event
                event_type = data.get("event_type")
                payload = data.get("payload", {})
                
                # Broadcast to all other clients in the business
                await manager.broadcast_to_business(
                    business_id,
                    event_type,
                    payload,
                    exclude_websocket=websocket
                )
            
            elif msg_type == "subscribe":
                # Client can be extended for specific event subscriptions
                await websocket.send_json({
                    "type": "subscribed",
                    "events": data.get("events", [])
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, business_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, business_id)


async def broadcast_sync_event(
    business_id: int,
    event_type: str,
    payload: dict
):
    """Helper function to broadcast sync events via WebSocket"""
    await manager.broadcast_to_business(business_id, event_type, payload)

