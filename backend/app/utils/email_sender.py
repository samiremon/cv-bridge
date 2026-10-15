import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr


def send_email_smtp(to_email: str, subject: str, body: str) -> None:
    """
    Sends an email to a candidate via standard SMTP (Gmail / Google Workspace).
    
    :param to_email: Candidate destination email address.
    :param subject: Email subject line.
    :param body: Plain text message content.
    :raises ValueError: If SMTP credentials are missing.
    :raises smtplib.SMTPException: If authentication or delivery fails.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "samiremon2001@gmail.com")
    smtp_pass = (os.getenv("SMTP_PASSWORD", "") or "").replace(" ", "").strip()
    email_from = os.getenv("EMAIL_FROM", "CV-Bridge Ltd. <samiremon2001@gmail.com>")

    if not smtp_user or not smtp_pass:
        raise ValueError(
            "SMTP credentials not fully configured. Please ensure SMTP_USER and SMTP_PASSWORD are set in your .env file."
        )

    # Construct standard multipart message
    msg = MIMEMultipart("alternative")

    if "<" in email_from and ">" in email_from:
        display_name = email_from.split("<")[0].strip()
        sender_addr = email_from.split("<")[1].split(">")[0].strip()
        msg["From"] = formataddr((str(Header(display_name, "utf-8")), sender_addr))
    else:
        msg["From"] = email_from

    msg["To"] = to_email.strip()
    msg["Subject"] = Header(subject, "utf-8")

    # Plain text email part
    msg.attach(MIMEText(body, "plain", "utf-8"))

    # Dispatch via TLS on port 587
    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [to_email.strip()], msg.as_string())
