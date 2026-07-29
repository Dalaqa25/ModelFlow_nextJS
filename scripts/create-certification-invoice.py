from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


OUTPUT = Path(__file__).resolve().parents[1] / "output" / "pdf" / "modelgrow-certification-invoice.pdf"


def build_invoice():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = A4
    document = canvas.Canvas(str(OUTPUT), pagesize=A4)
    styles = getSampleStyleSheet()

    navy = colors.HexColor("#11182D")
    purple = colors.HexColor("#7C5CFC")
    muted = colors.HexColor("#667085")
    pale = colors.HexColor("#F4F1FF")

    document.setFillColor(navy)
    document.rect(0, page_height - 50 * mm, page_width, 50 * mm, stroke=0, fill=1)
    document.setFillColor(colors.white)
    document.setFont("Helvetica-Bold", 20)
    document.drawString(20 * mm, page_height - 25 * mm, "MODELGROW TEST SUPPLIES")
    document.setFont("Helvetica", 10)
    document.drawString(20 * mm, page_height - 34 * mm, "Synthetic certification document - no payment required")

    document.setFillColor(purple)
    document.roundRect(page_width - 72 * mm, page_height - 39 * mm, 52 * mm, 18 * mm, 3 * mm, stroke=0, fill=1)
    document.setFillColor(colors.white)
    document.setFont("Helvetica-Bold", 18)
    document.drawCentredString(page_width - 46 * mm, page_height - 32 * mm, "INVOICE")

    top = page_height - 70 * mm
    document.setFillColor(navy)
    document.setFont("Helvetica-Bold", 11)
    document.drawString(20 * mm, top, "Bill to")
    document.setFont("Helvetica", 10)
    document.drawString(20 * mm, top - 7 * mm, "ModelGrow Certification Sandbox")
    document.drawString(20 * mm, top - 13 * mm, "Tbilisi, Georgia")

    document.setFont("Helvetica-Bold", 10)
    document.drawString(125 * mm, top, "Invoice number")
    document.drawString(125 * mm, top - 8 * mm, "Invoice date")
    document.drawString(125 * mm, top - 16 * mm, "Due date")
    document.setFont("Helvetica", 10)
    document.drawRightString(190 * mm, top, "MG-CERT-2026-001")
    document.drawRightString(190 * mm, top - 8 * mm, "2026-07-25")
    document.drawRightString(190 * mm, top - 16 * mm, "2026-08-01")

    table_top = top - 35 * mm
    document.setFillColor(pale)
    document.roundRect(20 * mm, table_top - 12 * mm, 170 * mm, 12 * mm, 2 * mm, stroke=0, fill=1)
    document.setFillColor(navy)
    document.setFont("Helvetica-Bold", 10)
    document.drawString(25 * mm, table_top - 8 * mm, "Description")
    document.drawRightString(135 * mm, table_top - 8 * mm, "Qty")
    document.drawRightString(160 * mm, table_top - 8 * mm, "Rate")
    document.drawRightString(185 * mm, table_top - 8 * mm, "Amount")

    rows = [
        ("Controlled workflow certification run", "1", "$40.00", "$40.00"),
        ("Duplicate-prevention verification", "1", "$10.00", "$10.00"),
    ]
    row_y = table_top - 25 * mm
    document.setFont("Helvetica", 10)
    for description, quantity, rate, amount in rows:
        document.drawString(25 * mm, row_y, description)
        document.drawRightString(135 * mm, row_y, quantity)
        document.drawRightString(160 * mm, row_y, rate)
        document.drawRightString(185 * mm, row_y, amount)
        document.setStrokeColor(colors.HexColor("#EAECF0"))
        document.line(20 * mm, row_y - 5 * mm, 190 * mm, row_y - 5 * mm)
        row_y -= 14 * mm

    summary_y = row_y - 4 * mm
    document.setFillColor(muted)
    document.drawRightString(160 * mm, summary_y, "Subtotal")
    document.drawRightString(185 * mm, summary_y, "$50.00")
    document.drawRightString(160 * mm, summary_y - 8 * mm, "Tax")
    document.drawRightString(185 * mm, summary_y - 8 * mm, "$9.00")
    document.setFillColor(navy)
    document.setFont("Helvetica-Bold", 13)
    document.drawRightString(160 * mm, summary_y - 20 * mm, "Total")
    document.drawRightString(185 * mm, summary_y - 20 * mm, "$59.00")

    document.setFillColor(colors.HexColor("#E8FFF6"))
    document.roundRect(20 * mm, 35 * mm, 170 * mm, 22 * mm, 3 * mm, stroke=0, fill=1)
    document.setFillColor(colors.HexColor("#087A55"))
    document.setFont("Helvetica-Bold", 10)
    document.drawString(27 * mm, 49 * mm, "CERTIFICATION FIXTURE")
    document.setFont("Helvetica", 9)
    document.drawString(27 * mm, 42 * mm, "Synthetic data only. This invoice must never be paid or treated as a real liability.")

    document.setFillColor(muted)
    document.setFont("Helvetica", 8)
    document.drawCentredString(page_width / 2, 18 * mm, "Generated exclusively for the ModelGrow controlled integration test.")
    document.save()


if __name__ == "__main__":
    build_invoice()
    print(OUTPUT)
