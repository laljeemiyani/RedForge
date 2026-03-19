from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfgen import canvas
import io
import json
from datetime import datetime

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setStrokeColor(colors.HexColor('#2E75B6'))
        self.line(inch, inch, self._pagesize[0] - inch, inch)
        
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.gray)
        self.drawString(inch, 0.75 * inch, "RedForge AI \u2014 Confidential Security Report")
        
        text = "Page %d of %d" % (self._pageNumber, page_count)
        self.drawRightString(self._pagesize[0] - inch, 0.75 * inch, text)
        self.restoreState()

class ReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'ReportTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#FFFFFF'),
            alignment=TA_LEFT,
            spaceAfter=0
        )
        self.subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=self.styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#1A3C6B'),
            alignment=TA_LEFT,
            spaceAfter=12
        )
        self.section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1A3C6B'),
            spaceBefore=12,
            spaceAfter=12
        )
        self.normal_style = self.styles['Normal']
        self.center_score_style = ParagraphStyle(
            'CenterScore',
            parent=self.styles['Normal'],
            fontSize=36,
            leading=44,
            alignment=TA_CENTER,
            spaceBefore=12,
            spaceAfter=24
        )
        
    def _create_header(self, elements):
        header_data = [[Paragraph('<b>\U0001F534 RedForge AI</b>', self.title_style)]]
        t = Table(header_data, colWidths=['100%'], rowHeights=[1*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1A3C6B')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))
        
        elements.append(Paragraph("AI Security Audit Report", self.subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2E75B6'), spaceBefore=5, spaceAfter=20))

    def _create_audit_info(self, elements, audit_data):
        target_name = str(audit_data.get('targetName', 'Unknown'))
        target_url = str(audit_data.get('targetUrl', 'Unknown'))
        audit_id = str(audit_data.get('auditId', 'Unknown'))
        completed_at = str(audit_data.get('completedAt', ''))
        
        try:
            if completed_at:
                dt = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                completed_at = dt.strftime('%Y-%m-%d %H:%M:%S UTC')
        except:
            pass
            
        status = str(audit_data.get('status', 'Unknown')).upper()
        
        data = [
            ["Target", target_name],
            ["Target URL", target_url],
            ["Audit ID", audit_id],
            ["Completed", completed_at],
            ["Status", status]
        ]
        
        t = Table(data, colWidths=['30%', '70%'])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#1A3C6B')),
            ('TEXTCOLOR', (0,0), (0,-1), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('BACKGROUND', (1,0), (1,-1), colors.HexColor('#F5F5F5')),
            ('TEXTCOLOR', (1,0), (1,-1), colors.black),
            ('GRID', (0,0), (-1,-1), 0.5, colors.white),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))

    def _create_risk_score(self, elements, audit_data):
        elements.append(Paragraph("<b>Overall Risk Score</b>", self.section_title_style))
        
        score = audit_data.get('riskScore', 0)
        
        if score <= 30:
            score_color = '#1E7A3E'
        elif score <= 60:
            score_color = '#D35400'
        else:
            score_color = '#C0392B'
            
        score_para = Paragraph(f"<font color='{score_color}'><b>{score}/100</b></font>", self.center_score_style)
        elements.append(score_para)
        
        findings_count = audit_data.get('findingsCount', {})
        critic = findings_count.get('critical', 0)
        high = findings_count.get('high', 0)
        med = findings_count.get('medium', 0)
        low = findings_count.get('low', 0)
        
        summary_text = f"<b>Critical: {critic}  |  High: {high}  |  Medium: {med}  |  Low: {low}</b>"
        summary_para = Paragraph(summary_text, ParagraphStyle('Summary', parent=self.normal_style, alignment=TA_CENTER))
        elements.append(summary_para)
        elements.append(Spacer(1, 40))

    def _create_findings(self, elements, audit_data):
        elements.append(Paragraph("<b>Detailed Findings</b>", self.section_title_style))
        elements.append(Spacer(1, 10))
        
        findings = audit_data.get('findings', [])
        
        for finding in findings:
            severity = str(finding.get('severity', 'low')).lower()
            if severity == 'critical':
                bg_color = '#C0392B'
            elif severity == 'high':
                bg_color = '#E67E22'
            elif severity == 'medium':
                bg_color = '#F1C40F'
            else:
                bg_color = '#27AE60'
                
            title = finding.get('title', 'Unknown Issue')
            title_text = f"[{severity.upper()}] {title}"
            
            # Header Bar
            header_table = Table([[Paragraph(f"<b><font color='white'>{title_text}</font></b>", self.normal_style)]], colWidths=['100%'])
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_color)),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            elements.append(header_table)
            elements.append(Spacer(1, 10))
            
            # Description
            desc = finding.get('description', '')
            elements.append(Paragraph(desc, self.normal_style))
            elements.append(Spacer(1, 10))
            
            # Information Table
            cat = str(finding.get('category', ''))
            rem = str(finding.get('remediation', ''))
            info_data = [
                ["Category", cat],
                ["Severity", severity.upper()],
                ["Remediation", Paragraph(rem, self.normal_style)]
            ]
            info_table = Table(info_data, colWidths=['20%', '80%'])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#EAEAEA')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            elements.append(info_table)
            elements.append(Spacer(1, 15))
            
            # Transcript
            transcript = finding.get('transcript', [])
            if transcript:
                elements.append(Paragraph("<b>Attack Transcript</b>", self.normal_style))
                elements.append(Spacer(1, 5))
                
                trans_data = [] 
                
                # Show Max 10 entries for readability
                for entry in transcript[:10]:
                    role = str(entry.get('role', '')).upper()
                    _content_full = str(entry.get('content', ''))
                    content = _content_full[:500]
                    if len(_content_full) > 500:
                        content += "..."
                    
                    content_clean = content.replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                    content_para = Paragraph(content_clean, self.normal_style)
                    trans_data.append([role, content_para])
                    
                if trans_data:
                    trans_table = Table(trans_data, colWidths=[1.2*inch, 5.3*inch])
                    
                    style_cmds = [
                        ('VALIGN', (0,0), (-1,-1), 'TOP'),
                        ('GRID', (0,0), (-1,-1), 0.25, colors.lightgrey),
                        ('PADDING', (0,0), (-1,-1), 6),
                        ('WORDWRAP', (0,0), (-1,-1), True),
                        ('FONTSIZE', (0,0), (-1,-1), 8),
                    ]
                    for i in range(len(trans_data)):
                        bg = '#F5F5F5' if i % 2 == 0 else '#FFFFFF'
                        style_cmds.append(('BACKGROUND', (0,i), (-1,i), colors.HexColor(bg)))
                        
                    trans_table.setStyle(TableStyle(style_cmds))
                    elements.append(trans_table)
                    
            elements.append(Spacer(1, 30))

    def generate(self, audit_data: dict) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=inch, leftMargin=inch,
            topMargin=inch, bottomMargin=1.2*inch
        )
        
        elements = []
        
        self._create_header(elements)
        self._create_audit_info(elements, audit_data)
        self._create_risk_score(elements, audit_data)
        self._create_findings(elements, audit_data)
        
        doc.build(elements, canvasmaker=NumberedCanvas)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
