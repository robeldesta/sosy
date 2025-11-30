"""
PDF invoice templates
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from typing import Optional
from io import BytesIO
from app.models.invoice import Invoice
from app.models.business import Business


def create_simple_retail_pdf(invoice: Invoice, business: Business, output: BytesIO) -> BytesIO:
    """Simple Retail template - minimal, bold headings"""
    doc = SimpleDocTemplate(output, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.black,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Business info
    business_style = ParagraphStyle(
        'BusinessInfo',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.black,
        spaceAfter=6
    )
    story.append(Paragraph(f"<b>{business.name}</b>", business_style))
    if business.address:
        story.append(Paragraph(business.address, styles['Normal']))
    if business.phone:
        story.append(Paragraph(f"Phone: {business.phone}", styles['Normal']))
    if business.tax_id:
        story.append(Paragraph(f"TIN: {business.tax_id}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Invoice details
    details_data = [
        [f"<b>Invoice #:</b> {invoice.invoice_number}", f"<b>Date:</b> {invoice.created_at.strftime('%Y-%m-%d %H:%M')}"],
    ]
    if invoice.customer_name:
        details_data.append([f"<b>Customer:</b> {invoice.customer_name}", ""])
        if invoice.customer_phone:
            details_data[1][1] = f"<b>Phone:</b> {invoice.customer_phone}"
    
    details_table = Table(details_data, colWidths=[4*inch, 2.5*inch])
    details_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Items table
    items_data = [["<b>Item</b>", "<b>Qty</b>", "<b>Price</b>", "<b>Total</b>"]]
    
    for item in invoice.items:
        # Get product name from stock item
        product_name = f"Item {item.stock_item_id}"  # TODO: Get actual product name
        items_data.append([
            product_name,
            str(item.quantity),
            f"{item.unit_price:.2f}",
            f"{item.total:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.25*inch, 1.25*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Totals
    totals_data = [
        ["Subtotal:", f"{invoice.subtotal:.2f} ETB"],
    ]
    if invoice.discount > 0:
        totals_data.append(["Discount:", f"-{invoice.discount:.2f} ETB"])
    totals_data.extend([
        ["Tax (15%):", f"{invoice.tax:.2f} ETB"],
        ["<b>TOTAL:</b>", f"<b>{invoice.total:.2f} ETB</b>"]
    ])
    
    totals_table = Table(totals_data, colWidths=[4*inch, 2.5*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 14),
        ('FONTSIZE', (0, 0), (0, -2), 10),
        ('TOPPADDING', (0, -1), (-1, -1), 12),
    ]))
    story.append(totals_table)
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    story.append(Paragraph("Generated via Telegram Mini App", footer_style))
    
    doc.build(story)
    return output


def create_modern_clean_pdf(invoice: Invoice, business: Business, output: BytesIO) -> BytesIO:
    """Modern Clean template - table layout, separators"""
    doc = SimpleDocTemplate(output, pagesize=A4, topMargin=0.7*inch, bottomMargin=0.7*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Header with business info
    header_data = [
        [business.name, f"Invoice #{invoice.invoice_number}"],
    ]
    if business.address:
        header_data.append([business.address, f"Date: {invoice.created_at.strftime('%Y-%m-%d')}"])
    if business.phone:
        header_data.append([f"Phone: {business.phone}", f"Time: {invoice.created_at.strftime('%H:%M')}"])
    if business.tax_id:
        header_data.append([f"TIN: {business.tax_id}", ""])
    
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 16),
        ('FONTSIZE', (1, 0), (1, 0), 12),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.grey),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.4*inch))
    
    # Customer info
    if invoice.customer_name:
        customer_data = [
            ["Customer:", invoice.customer_name],
        ]
        if invoice.customer_phone:
            customer_data.append(["Phone:", invoice.customer_phone])
        
        customer_table = Table(customer_data, colWidths=[1.5*inch, 5.5*inch])
        customer_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(customer_table)
        story.append(Spacer(1, 0.3*inch))
    
    # Items table with modern styling
    items_data = [["Description", "Qty", "Unit Price", "Amount"]]
    
    for item in invoice.items:
        product_name = f"Item {item.stock_item_id}"
        items_data.append([
            product_name,
            str(item.quantity),
            f"{item.unit_price:.2f}",
            f"{item.total:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3.5*inch, 0.8*inch, 1.2*inch, 1.3*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.black),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.4*inch))
    
    # Totals
    totals_data = [
        ["", "Subtotal:", f"{invoice.subtotal:.2f} ETB"],
    ]
    if invoice.discount > 0:
        totals_data.append(["", "Discount:", f"-{invoice.discount:.2f} ETB"])
    totals_data.extend([
        ["", "Tax (15%):", f"{invoice.tax:.2f} ETB"],
        ["", "TOTAL:", f"{invoice.total:.2f} ETB"]
    ])
    
    totals_table = Table(totals_data, colWidths=[3.5*inch, 1.5*inch, 1.8*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTNAME', (1, -1), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (1, -1), (2, -1), 12),
        ('FONTSIZE', (1, 0), (2, -2), 10),
        ('TOPPADDING', (1, -1), (2, -1), 12),
        ('LINEABOVE', (1, -1), (2, -1), 1, colors.black),
    ]))
    story.append(totals_table)
    
    # Footer
    story.append(Spacer(1, 0.6*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    story.append(Paragraph("Generated via Telegram Mini App", footer_style))
    
    doc.build(story)
    return output


def create_blue_accent_pdf(invoice: Invoice, business: Business, output: BytesIO) -> BytesIO:
    """Blue Accent template - Telegram-blue header + QR code placeholder"""
    doc = SimpleDocTemplate(output, pagesize=A4, topMargin=0, bottomMargin=0.5*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Blue header
    header_color = colors.HexColor('#3390ec')  # Telegram blue
    header_data = [
        [business.name, f"Invoice #{invoice.invoice_number}"],
    ]
    
    header_table = Table(header_data, colWidths=[4*inch, 3*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 18),
        ('FONTSIZE', (1, 0), (1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 20),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 20),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Business details
    business_info = []
    if business.address:
        business_info.append(business.address)
    if business.phone:
        business_info.append(f"Phone: {business.phone}")
    if business.tax_id:
        business_info.append(f"TIN: {business.tax_id}")
    
    for info in business_info:
        story.append(Paragraph(info, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Invoice date and customer
    info_data = [
        [f"Date: {invoice.created_at.strftime('%Y-%m-%d %H:%M')}", ""],
    ]
    if invoice.customer_name:
        info_data.append([f"Customer: {invoice.customer_name}", ""])
        if invoice.customer_phone:
            info_data[1][1] = f"Phone: {invoice.customer_phone}"
    
    info_table = Table(info_data, colWidths=[3.5*inch, 3.5*inch])
    info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Items table
    items_data = [["Item", "Qty", "Price", "Total"]]
    
    for item in invoice.items:
        product_name = f"Item {item.stock_item_id}"
        items_data.append([
            product_name,
            str(item.quantity),
            f"{item.unit_price:.2f}",
            f"{item.total:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f4fd')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d0e8f7')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Totals
    totals_data = [
        ["Subtotal:", f"{invoice.subtotal:.2f} ETB"],
    ]
    if invoice.discount > 0:
        totals_data.append(["Discount:", f"-{invoice.discount:.2f} ETB"])
    totals_data.extend([
        ["Tax (15%):", f"{invoice.tax:.2f} ETB"],
        ["TOTAL:", f"{invoice.total:.2f} ETB"]
    ])
    
    totals_table = Table(totals_data, colWidths=[4*inch, 3*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (1, -1), 14),
        ('FONTSIZE', (0, 0), (1, -2), 11),
        ('TOPPADDING', (0, -1), (1, -1), 12),
        ('LINEABOVE', (0, -1), (1, -1), 2, header_color),
    ]))
    story.append(totals_table)
    
    # QR Code placeholder (centered)
    story.append(Spacer(1, 0.4*inch))
    qr_placeholder = Paragraph(
        "[QR Code Placeholder]<br/>Scan to verify invoice",
        ParagraphStyle('QRPlaceholder', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER, textColor=colors.grey)
    )
    story.append(qr_placeholder)
    
    # Footer
    story.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    story.append(Paragraph("Generated via Telegram Mini App", footer_style))
    
    doc.build(story)
    return output


def generate_invoice_pdf(invoice: Invoice, business: Business, template: str = "simple") -> BytesIO:
    """
    Generate PDF invoice based on template
    
    Args:
        invoice: Invoice object
        business: Business object
        template: Template name (simple, modern, blue)
        
    Returns:
        BytesIO buffer with PDF content
    """
    output = BytesIO()
    
    if template == "modern":
        return create_modern_clean_pdf(invoice, business, output)
    elif template == "blue":
        return create_blue_accent_pdf(invoice, business, output)
    else:  # default to simple
        return create_simple_retail_pdf(invoice, business, output)

