from io import BytesIO
from sqlmodel import Session
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from app.models.purchase import Purchase


def generate_purchase_pdf(session: Session, purchase: Purchase) -> bytes:
    """Generate a Goods Received Note PDF for a purchase"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#000000'),
        spaceAfter=12,
        alignment=TA_CENTER,
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#333333'),
        spaceAfter=6,
        alignment=TA_LEFT,
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    
    # Title
    story.append(Paragraph("GOODS RECEIVED NOTE", title_style))
    story.append(Spacer(1, 10 * mm))
    
    # Purchase Info
    purchase_info_data = [
        ['Purchase Number:', purchase.purchase_number],
        ['Date:', purchase.date.strftime('%Y-%m-%d %H:%M')],
        ['Status:', purchase.status.upper()],
    ]
    
    purchase_info_table = Table(purchase_info_data, colWidths=[60 * mm, 100 * mm])
    purchase_info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(purchase_info_table)
    story.append(Spacer(1, 8 * mm))
    
    # Supplier Info
    story.append(Paragraph("Supplier Information", heading_style))
    supplier_data = [
        ['Name:', purchase.supplier.name],
        ['Phone:', purchase.supplier.phone or 'N/A'],
        ['Address:', purchase.supplier.address or 'N/A'],
    ]
    
    supplier_table = Table(supplier_data, colWidths=[60 * mm, 100 * mm])
    supplier_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(supplier_table)
    story.append(Spacer(1, 8 * mm))
    
    # Items Table
    story.append(Paragraph("Items", heading_style))
    
    items_data = [['#', 'Product', 'Quantity', 'Unit Cost', 'Total']]
    
    for idx, item in enumerate(purchase.items, 1):
        product_name = item.product.name if item.product else f"Product ID: {item.product_id}"
        items_data.append([
            str(idx),
            product_name,
            f"{item.quantity:.2f}",
            f"{item.unit_cost:.2f} ETB",
            f"{item.total:.2f} ETB",
        ])
    
    items_table = Table(items_data, colWidths=[15 * mm, 70 * mm, 30 * mm, 35 * mm, 30 * mm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#000000')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8 * mm))
    
    # Totals
    totals_data = [
        ['Subtotal:', f"{purchase.subtotal:.2f} ETB"],
        ['Tax (15%):', f"{purchase.tax:.2f} ETB"],
        ['Total:', f"{purchase.total:.2f} ETB"],
    ]
    
    totals_table = Table(totals_data, colWidths=[120 * mm, 40 * mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTSIZE', (0, -1), (-1, -1), 12),  # Make total bigger
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#000000')),
    ]))
    story.append(totals_table)
    
    # Notes
    if purchase.notes:
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Notes", heading_style))
        story.append(Paragraph(purchase.notes, normal_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


