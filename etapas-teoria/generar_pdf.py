import os
import re
import html
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Define NumberedCanvas for header/footer and page numbering
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#4a5568"))
        
        # Header (A4 width=595.27, height=841.89)
        self.drawString(54, 800, "Documento Integral de Gestión del Proyecto — Cooperadora Hospital Municipal")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))  # Slate-300
        self.setLineWidth(0.5)
        self.line(54, 792, 541, 792)
        
        # Footer
        self.line(54, 55, 541, 55)
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(541, 42, page_text)
        self.drawString(54, 42, "Gestión del Desarrollo de Software — Prof. Fernández Carbonell")
        self.restoreState()

# Formatter helpers
def format_inline(text):
    # Escape raw HTML chars first
    text = html.escape(text)
    # Restore basic HTML tags that reportlab uses, or convert markdown to them
    # Bold: **text**
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Italic: *text*
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Code inline: `code`
    text = re.sub(r'`(.*?)`', r'<font name="Courier" color="#b00020"><b>\1</b></font>', text)
    # Links: [text](url)
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2"><font color="#005f73"><u>\1</u></font></a>', text)
    return text

def format_code(text):
    # Escape HTML characters first
    escaped = html.escape(text)
    # Convert newlines to <br/> and replace spaces with non-breaking spaces
    lines = escaped.split('\n')
    formatted_lines = []
    for line in lines:
        # Count leading spaces
        num_spaces = len(line) - len(line.lstrip(' '))
        # Replace leading spaces with &nbsp;
        line_formatted = '&nbsp;' * num_spaces + line.lstrip(' ')
        formatted_lines.append(line_formatted)
    return "<br/>".join(formatted_lines)

def parse_markdown(filepath, styles):
    story = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Skip first 14 lines containing duplicate cover page metadata
    if len(lines) > 14 and lines[14].strip().startswith("# PARTE 1"):
        lines = lines[14:]
        
    in_table = False
    in_code_block = False
    table_lines = []
    code_block_lines = []
    
    # We will accumulate paragraphs that span multiple lines
    current_para = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Handle Code Block
        if stripped.startswith("```"):
            if in_code_block:
                # End of code block
                code_text = "\n".join(code_block_lines)
                formatted_code = format_code(code_text)
                # ReportLab Paragraph wrapped inside a keep-together
                p = Paragraph(formatted_code, styles['MDCodeBlock'])
                story.append(KeepTogether([p, Spacer(1, 10)]))
                code_block_lines = []
                in_code_block = False
            else:
                in_code_block = True
            i += 1
            continue
            
        if in_code_block:
            code_block_lines.append(line.rstrip('\n'))
            i += 1
            continue
            
        # Handle Table
        if stripped.startswith("|"):
            in_table = True
            table_lines.append(stripped)
            i += 1
            continue
        elif in_table:
            # End of table
            table_obj = process_table(table_lines, styles)
            if table_obj:
                story.append(table_obj)
                story.append(Spacer(1, 12))
            table_lines = []
            in_table = False
            # Do not increment i, re-evaluate line with in_table = False
            continue
            
        # Handle Headings
        if stripped.startswith("#"):
            # Flush current paragraph first
            flush_paragraph(current_para, story, styles)
            current_para = []
            
            # Determine Heading level
            level = 0
            for char in stripped:
                if char == '#':
                    level += 1
                else:
                    break
            heading_text = stripped[level:].strip()
            heading_text_formatted = format_inline(heading_text)
            
            if level == 1:
                if len(story) > 0:  # Avoid empty page before PARTE 1
                    story.append(PageBreak())  # Start major sections on a new page
                story.append(Paragraph(heading_text_formatted, styles['MDH1']))
                story.append(Spacer(1, 10))
            elif level == 2:
                story.append(Paragraph(heading_text_formatted, styles['MDH2']))
                story.append(Spacer(1, 8))
            elif level == 3:
                story.append(Paragraph(heading_text_formatted, styles['MDH3']))
                story.append(Spacer(1, 6))
            else:
                story.append(Paragraph(heading_text_formatted, styles['MDH4']))
                story.append(Spacer(1, 4))
            i += 1
            continue
            
        # Handle Bullet list items
        if stripped.startswith("- ") or stripped.startswith("* "):
            # Flush current paragraph first
            flush_paragraph(current_para, story, styles)
            current_para = []
            
            bullet_text = stripped[2:].strip()
            bullet_text_formatted = format_inline(bullet_text)
            story.append(Paragraph(f"&bull; {bullet_text_formatted}", styles['MDBullet']))
            story.append(Spacer(1, 4))
            i += 1
            continue
            
        # Blank line
        if stripped == "":
            flush_paragraph(current_para, story, styles)
            current_para = []
            i += 1
            continue
            
        # Normal line - accumulate
        current_para.append(stripped)
        i += 1
        
    # Flush remaining
    if in_table:
        table_obj = process_table(table_lines, styles)
        if table_obj:
            story.append(table_obj)
    flush_paragraph(current_para, story, styles)
    
    return story

def flush_paragraph(para_lines, story, styles):
    if not para_lines:
        return
    text = " ".join(para_lines)
    formatted = format_inline(text)
    story.append(Paragraph(formatted, styles['Normal']))
    story.append(Spacer(1, 10))

def process_table(table_lines, styles):
    if len(table_lines) < 2:
        return None
        
    # Clean cells
    rows_data = []
    for line in table_lines:
        # Check if it's separator like |---|---|
        if re.match(r'^\|[\s:-|]+$', line):
            continue
        cells = [c.strip() for c in line.split("|")]
        # Remove empty first/last
        if cells and cells[0] == "":
            cells.pop(0)
        if cells and cells[-1] == "":
            cells.pop()
        rows_data.append(cells)
        
    if not rows_data:
        return None
        
    # Check headers to decide col widths
    headers = rows_data[0]
    num_cols = len(headers)
    
    # Check if this is a Gantt table
    is_gantt = False
    headers_lower = [h.lower() for h in headers]
    if "s1" in headers_lower and "s12" in headers_lower:
        is_gantt = True
    
    col_widths = None
    headers_str = " ".join(headers).lower()
    
    if is_gantt:
        col_widths = [140, 75, 45] + [18] * 12
    elif "stakeholder" in headers_str:
        col_widths = [120, 260, 100]
    elif "backlog" in headers_str or "código" in headers_str:
        col_widths = [50, 240, 60, 60, 70]
    elif "nivel wbs" in headers_str:
        col_widths = [50, 50, 140, 240]
    elif "justificación" in headers_str:
        col_widths = [60, 60, 360]
    elif "riesgo" in headers_str:
        col_widths = [40, 240, 70, 70, 60]
    elif "integrante" in headers_str:
        col_widths = [100, 140, 60, 80, 100]
    elif "concepto" in headers_str:
        col_widths = [100, 220, 80, 80]
    elif "entregable" in headers_str:
        col_widths = [120, 260, 100]
    elif "impacto" in headers_str:
        col_widths = [90, 100, 90, 100, 100]
    else:
        # Default evenly split
        col_widths = [480.0 / num_cols] * num_cols
        
    # Construct ReportLab Table cells
    table_rows = []
    gantt_bg_cmds = []
    
    for r_idx, row in enumerate(rows_data):
        row_cells = []
        for c_idx, cell in enumerate(row):
            formatted_cell = format_inline(cell)
            
            # Special case for Gantt weeks: make them empty colored cells
            if is_gantt and r_idx > 0 and c_idx >= 3:
                p = Paragraph("", styles['MDTableCell'])
                if "■" in cell or "■" in formatted_cell:
                    gantt_bg_cmds.append(('BACKGROUND', (c_idx, r_idx), (c_idx, r_idx), colors.HexColor("#0a9396")))
                else:
                    gantt_bg_cmds.append(('BACKGROUND', (c_idx, r_idx), (c_idx, r_idx), colors.HexColor("#f1f5f9")))
            else:
                if r_idx == 0:
                    p = Paragraph(formatted_cell, styles['MDTableHeader'])
                else:
                    p = Paragraph(formatted_cell, styles['MDTableCell'])
            row_cells.append(p)
        table_rows.append(row_cells)
        
    t = Table(table_rows, colWidths=col_widths)
    t_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#005f73")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]
    
    if is_gantt:
        t_cmds.extend(gantt_bg_cmds)
        # Center align weeks text and adjust padding
        for col in range(3, 15):
            t_cmds.append(('ALIGN', (col, 0), (col, 0), 'CENTER'))
            t_cmds.append(('LEFTPADDING', (col, 0), (col, -1), 1))
            t_cmds.append(('RIGHTPADDING', (col, 0), (col, -1), 1))
    else:
        # Alternating rows
        for i in range(1, len(table_rows)):
            bg = colors.HexColor("#f8fafc") if i % 2 == 1 else colors.white
            t_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
            
    t_style = TableStyle(t_cmds)
    t.setStyle(t_style)
    return t

def build_pdf(md_file, pdf_file):
    styles = getSampleStyleSheet()
    
    # Add custom styles or modify existing
    styles['Normal'].textColor = colors.HexColor("#1e293b")
    styles['Normal'].fontSize = 10
    styles['Normal'].leading = 14
    
    styles.add(ParagraphStyle(
        name='MDH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#005f73"),
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    ))
    
    styles.add(ParagraphStyle(
        name='MDH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0a9396"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    ))
    
    styles.add(ParagraphStyle(
        name='MDH3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#4a5568"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    ))
    
    styles.add(ParagraphStyle(
        name='MDH4',
        parent=styles['Heading4'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='MDBullet',
        parent=styles['Normal'],
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=4
    ))
    
    styles.add(ParagraphStyle(
        name='MDCodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8, # Size 8 fits code blocks and Gantt charts nicely
        leading=10,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderPadding=8,
        borderWidth=0.5,
        borderColor=colors.HexColor("#cbd5e1"),
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='MDTableHeader',
        parent=styles['Normal'],
        textColor=colors.white,
        fontSize=9,
        leading=12,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='MDTableCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=12
    ))
    
    # Cover page styles
    cover_title_style = ParagraphStyle(
        name='CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        alignment=1, # Center
        textColor=colors.HexColor("#005f73"),
        spaceAfter=15
    )
    
    cover_subtitle_style = ParagraphStyle(
        name='CoverSubtitle',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        alignment=1,
        textColor=colors.HexColor("#0a9396"),
        spaceAfter=10
    )
    
    cover_meta_style = ParagraphStyle(
        name='CoverMeta',
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#4a5568")
    )
    
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=A4,
        leftMargin=54, # 0.75 in
        rightMargin=54,
        topMargin=72,  # 1 in
        bottomMargin=72
    )
    
    story = []
    
    # 1. BUILD COVER PAGE
    story.append(Spacer(1, 100))
    story.append(Paragraph("TRABAJO PRÁCTICO INTEGRADOR", cover_subtitle_style))
    story.append(Paragraph("DOCUMENTO INTEGRAL DE GESTIÓN DEL PROYECTO", cover_title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Portal Web de la Asociación Cooperadora del Hospital Municipal \"Dr. Emilio Ferreyra\" (Necochea)</b>", cover_subtitle_style))
    story.append(Spacer(1, 80))
    
    # Horizontal rule
    hr = Table([[""]], colWidths=[480], rowHeights=[2])
    hr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#005f73")),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(hr)
    story.append(Spacer(1, 40))
    
    metadata_html = """
    <b>Materia:</b> Gestión del Desarrollo de Software<br/>
    <b>Profesor:</b> Fernández Carbonell, Cesar Augusto<br/>
    <br/>
    <b>Integrantes del Grupo:</b><br/>
    Aramis Prieto &bull; Kevin Nielsen &bull; Thiago Masson &bull; Santiago Ialungo<br/>
    <br/>
    <b>Institución Base:</b> UTN Extensión Áulica Necochea<br/>
    <b>Fecha de Entrega:</b> 19 de Junio de 2026
    """
    story.append(Paragraph(metadata_html, cover_meta_style))
    story.append(Spacer(1, 100))
    
    story.append(PageBreak())
    
    # 2. PARSE AND APPEND CONTENT FROM MARKDOWN
    content_story = parse_markdown(md_file, styles)
    story.extend(content_story)
    
    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully compiled {pdf_file} from {md_file}!")

if __name__ == "__main__":
    md_path = "Documento_Gestion_Proyecto.md"
    pdf_path = "Documento_Gestion_Proyecto.pdf"
    build_pdf(md_path, pdf_path)
