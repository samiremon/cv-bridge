import io
import re
from typing import Any, Dict, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable


def highlight_text(text: str, highlight_keywords: List[str]) -> str:
    """
    Wraps matched keywords with a clear, noticeable green/lime highlight using ReportLab font/backcolor markup.
    """
    if not text or not highlight_keywords:
        return text
    
    result = text
    for raw_kw in highlight_keywords:
        # Split multi-word requirements (e.g. "Docker & Kubernetes" -> ["Docker", "Kubernetes"])
        sub_kws = re.split(r"[,/&|]+|\band\b", raw_kw, flags=re.IGNORECASE)
        for kw in sub_kws:
            kw = kw.strip()
            if len(kw) < 2:
                continue
            pattern = re.compile(rf"(?<![<a-zA-Z0-9])({re.escape(kw)})(?![>a-zA-Z0-9])", re.IGNORECASE)
            # Vibrant ATS Green badge highlight with dark green bold text
            result = pattern.sub(r"<font backcolor='#86EFAC' color='#064E3B'><b> \1 </b></font>", result)
    return result


def generate_pdf_from_cv_json(
    tailored_cv: Dict[str, Any], 
    candidate_name: str = "Samir Yeasir Emon",
    highlight_keywords: Optional[List[str]] = None
) -> bytes:
    """
    Generates an executive, ATS-optimized PDF matching the exact layout, font hierarchies,
    and sections of an engineering resume.
    If highlight_keywords is provided, newly tailored additions are highlighted with a green badge background.
    """
    buffer = io.BytesIO()
    keywords = [k for k in (highlight_keywords or []) if k.strip()]
    
    # 0.5 in margins (36pt)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    name_style = ParagraphStyle(
        'CVName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        alignment=0,
        spaceAfter=2
    )

    contact_style = ParagraphStyle(
        'CVContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        spaceAfter=4
    )

    headline_style = ParagraphStyle(
        'CVHeadline',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1D4ED8'),
        spaceAfter=6
    )

    section_heading = ParagraphStyle(
        'CVSectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=8,
        spaceAfter=3,
        textTransform='uppercase'
    )

    body_style = ParagraphStyle(
        'CVBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=3
    )

    job_title_style = ParagraphStyle(
        'CVJobTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=4,
        spaceAfter=2
    )

    bullet_style = ParagraphStyle(
        'CVBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=2.5,
        leftIndent=10
    )

    story = []

    # 1. Header: Name
    name = tailored_cv.get("name") or candidate_name or "Samir Yeasir Emon"
    if name.lower() in ["candidate", "none", ""]:
        name = "Samir Yeasir Emon"
    story.append(Paragraph(name, name_style))

    # Headline
    headline = tailored_cv.get("headline", "")
    if headline:
        headline_formatted = highlight_text(headline, keywords) if keywords else headline
        story.append(Paragraph(headline_formatted, headline_style))

    # Contact Info Bar
    contact_info = tailored_cv.get("contact_info", {})
    if contact_info and isinstance(contact_info, dict):
        contact_items = [f"{v}" for k, v in contact_info.items() if v]
        if contact_items:
            story.append(Paragraph(" &bull; ".join(contact_items), contact_style))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#94A3B8'), spaceAfter=6, spaceBefore=2))

    # 2. Professional Summary
    summary = tailored_cv.get("summary", "")
    if summary:
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=4, spaceBefore=1))
        summary_formatted = highlight_text(summary, keywords) if keywords else summary
        story.append(Paragraph(summary_formatted, body_style))
        story.append(Spacer(1, 3))

    # 3. Technical Skills
    skills_by_category = tailored_cv.get("skills_by_category", {})
    general_skills = tailored_cv.get("key_skills") or tailored_cv.get("skills") or []
    
    if skills_by_category or general_skills:
        story.append(Paragraph("TECHNICAL SKILLS", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=4, spaceBefore=1))
        
        if isinstance(skills_by_category, dict) and skills_by_category:
            for category, sk_list in skills_by_category.items():
                if isinstance(sk_list, list) and sk_list:
                    formatted_skills = []
                    for s in sk_list:
                        s_str = str(s)
                        if keywords:
                            s_str = highlight_text(s_str, keywords)
                        formatted_skills.append(s_str)
                    formatted_line = f"<b>{category}:</b> " + ", ".join(formatted_skills)
                    story.append(Paragraph(formatted_line, body_style))
                elif isinstance(sk_list, str):
                    s_str = highlight_text(sk_list, keywords) if keywords else sk_list
                    story.append(Paragraph(f"<b>{category}:</b> {s_str}", body_style))
        elif general_skills:
            if isinstance(general_skills, list):
                f_skills = [highlight_text(str(s), keywords) if keywords else str(s) for s in general_skills]
                story.append(Paragraph(f"<b>Core Technologies:</b> {', '.join(f_skills)}", body_style))
            else:
                s_str = highlight_text(str(general_skills), keywords) if keywords else str(general_skills)
                story.append(Paragraph(f"<b>Core Technologies:</b> {s_str}", body_style))
        story.append(Spacer(1, 3))

    # 4. Work Experience
    experience = tailored_cv.get("experience") or tailored_cv.get("experience_bullets") or tailored_cv.get("tailored_experience") or []
    if experience:
        story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=4, spaceBefore=1))
        
        for exp in experience:
            if isinstance(exp, dict):
                company = exp.get("company", "")
                role = exp.get("role", "")
                duration = exp.get("duration", "")
                location = exp.get("location", "")
                
                header_parts = []
                if role:
                    header_parts.append(f"<b>{role}</b>")
                if company:
                    header_parts.append(f"| <b>{company}</b>")
                if location:
                    header_parts.append(f"| {location}")
                if duration:
                    header_parts.append(f"<font color='#64748B'><i>({duration})</i></font>")
                
                story.append(Paragraph(" ".join(header_parts), job_title_style))

                bullets = exp.get("bullets") or exp.get("bullet_points") or []
                for bp in bullets:
                    bp_formatted = highlight_text(bp, keywords) if keywords else bp
                    story.append(Paragraph(f"&bull;&nbsp;&nbsp;{bp_formatted}", bullet_style))
                story.append(Spacer(1, 2))
            elif isinstance(exp, str):
                exp_formatted = highlight_text(exp, keywords) if keywords else exp
                story.append(Paragraph(f"&bull;&nbsp;&nbsp;{exp_formatted}", bullet_style))
        story.append(Spacer(1, 3))

    # 5. Technical Projects
    projects = tailored_cv.get("projects", [])
    if projects and isinstance(projects, list):
        story.append(Paragraph("PROJECTS", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=4, spaceBefore=1))
        
        for proj in projects:
            if isinstance(proj, dict):
                title = proj.get("title", "")
                technologies = proj.get("technologies", "")
                bullets = proj.get("bullets", [])
                
                proj_header = f"<b>{title}</b>"
                if technologies:
                    tech_formatted = highlight_text(technologies, keywords) if keywords else technologies
                    proj_header += f" <font color='#64748B'><i>| {tech_formatted}</i></font>"
                story.append(Paragraph(proj_header, job_title_style))

                for bp in bullets:
                    bp_formatted = highlight_text(bp, keywords) if keywords else bp
                    story.append(Paragraph(f"&bull;&nbsp;&nbsp;{bp_formatted}", bullet_style))
                story.append(Spacer(1, 2))
        story.append(Spacer(1, 3))

    # 6. Education
    education = tailored_cv.get("education", [])
    if education and isinstance(education, list):
        story.append(Paragraph("EDUCATION", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=4, spaceBefore=1))
        
        for edu in education:
            if isinstance(edu, dict):
                degree = edu.get("degree", "")
                institution = edu.get("institution", "")
                duration = edu.get("duration", "")
                details = edu.get("details", "")
                
                edu_parts = []
                if degree:
                    edu_parts.append(f"<b>{degree}</b>")
                if institution:
                    edu_parts.append(f"| {institution}")
                if duration:
                    edu_parts.append(f"<font color='#64748B'><i>({duration})</i></font>")
                
                story.append(Paragraph(" ".join(edu_parts), job_title_style))
                if details:
                    story.append(Paragraph(f"&bull;&nbsp;&nbsp;{details}", bullet_style))
                story.append(Spacer(1, 2))
            elif isinstance(edu, str):
                story.append(Paragraph(f"&bull;&nbsp;&nbsp;{edu}", bullet_style))
        story.append(Spacer(1, 3))

    # 7. Certifications
    certifications = tailored_cv.get("certifications", [])
    if certifications and isinstance(certifications, list) and len(certifications) > 0:
        story.append(Paragraph("CERTIFICATIONS", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=4, spaceBefore=1))
        for cert in certifications:
            cert_formatted = highlight_text(cert, keywords) if keywords else cert
            story.append(Paragraph(f"&bull;&nbsp;&nbsp;{cert_formatted}", bullet_style))

    # Build PDF
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
