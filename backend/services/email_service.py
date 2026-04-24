"""Email service for sending emails."""
from flask import current_app
from flask_mail import Message
from app import mail
import os


class EmailService:
    """Service for sending emails."""
    
    @staticmethod
    def send_welcome_email(to_email, member_name, username, password):
        """Send welcome email to newly registered member."""
        try:
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            sender = os.getenv('MAIL_DEFAULT_SENDER') or os.getenv('MAIL_USERNAME')
            
            if not sender:
                current_app.logger.error("EMAIL FAILED: No sender configured. Set MAIL_DEFAULT_SENDER in .env")
                return False

            if not to_email or '@' not in to_email:
                current_app.logger.error(f"EMAIL FAILED: Invalid recipient email: {to_email}")
                return False
            
            subject = "Welcome to GOFIT - Your Membership Details"
            
            # IMPORTANT: Keep HTML small to avoid Gmail clipping (102KB limit)
            # No base64 images - use text-based logo only
            html_body = """<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body{margin:0;padding:0;background:#0B0B0B;font-family:Arial,sans-serif}
.wrap{max-width:560px;margin:0 auto;background:#1A1A1A}
.hdr{background:#F2C228;padding:32px 20px;text-align:center}
.logo-text{font-size:48px;font-weight:900;color:#0B0B0B;letter-spacing:4px;font-family:Arial Black,Arial,sans-serif}
.logo-sub{font-size:10px;letter-spacing:5px;color:#0B0B0B;font-weight:700;margin-top:6px}
.body{padding:32px 24px}
.hi{font-size:22px;font-weight:700;color:#F2C228;text-align:center;margin-bottom:12px}
.msg{font-size:15px;color:#CCC;text-align:center;line-height:1.7;margin-bottom:24px}
.box{background:#F2C228;border-radius:10px;padding:24px 20px;margin:0 0 24px}
.box-title{font-size:14px;font-weight:800;color:#0B0B0B;text-align:center;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px}
.row{background:rgba(0,0,0,0.8);border-radius:8px;padding:14px 16px;margin:10px 0}
.lbl{font-size:10px;font-weight:700;color:#F2C228;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:6px}
.val{font-size:18px;font-weight:700;color:#FFF;font-family:'Courier New',monospace;word-break:break-all}
.info{border-left:3px solid #F2C228;padding:16px 20px;margin:0 0 24px;background:rgba(242,194,40,0.07)}
.info-t{font-size:14px;font-weight:700;color:#F2C228;margin-bottom:10px}
.info ul{margin:0;padding-left:18px;color:#CCC;font-size:14px}
.info li{margin:6px 0}
.btn-wrap{text-align:center;margin:24px 0}
.btn{display:inline-block;padding:14px 40px;background:#F2C228;color:#0B0B0B;text-decoration:none;border-radius:50px;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:1px}
.help{background:rgba(242,194,40,0.05);border-radius:8px;padding:16px;text-align:center;margin-top:20px}
.help-t{font-size:14px;font-weight:700;color:#F2C228;margin-bottom:6px}
.help-m{font-size:13px;color:#AAA}
.ftr{background:#0B0B0B;text-align:center;padding:24px 20px;border-top:1px solid rgba(242,194,40,0.15)}
.ftr-logo{font-size:22px;font-weight:900;color:#F2C228;letter-spacing:3px}
.ftr-tag{font-size:12px;color:#888;margin:4px 0 12px}
.ftr-copy{font-size:11px;color:#555}
@media(max-width:600px){.body{padding:24px 16px}.val{font-size:16px}.btn{padding:12px 30px;font-size:14px}}
</style>
</head>
<body>
<div class="wrap">
<div class="hdr">
  <div class="logo-text">GOFIT</div>
  <div class="logo-sub">ACTIVE LIFESTYLE</div>
</div>
<div class="body">
  <div class="hi">Welcome, """ + member_name + """! &#127881;</div>
  <div class="msg">Your membership has been successfully activated. You are all set to begin your fitness journey with us.</div>
  <div class="box">
    <div class="box-title">Your Login Credentials</div>
    <div class="row">
      <span class="lbl">Username</span>
      <span class="val">""" + username + """</span>
    </div>
    <div class="row">
      <span class="lbl">Password</span>
      <span class="val">""" + password + """</span>
    </div>
  </div>
  <div class="info">
    <div class="info-t">What You Can Do:</div>
    <ul>
      <li>Mark attendance via the mobile app</li>
      <li>View membership details and package info</li>
      <li>Access gym facilities during operating hours</li>
    </ul>
  </div>
  <div class="btn-wrap">
    <a href=\"""" + frontend_url + """/login\" class="btn">Login to Your Account</a>
  </div>
  <div class="help">
    <div class="help-t">Need Help?</div>
    <div class="help-m">Contact our front desk during operating hours.</div>
  </div>
</div>
<div class="ftr">
  <div class="ftr-logo">GOFIT</div>
  <div class="ftr-tag">Your Partner in Fitness Excellence</div>
  <div class="ftr-copy">&#169; 2026 GOFIT Gym Management System &bull; Karachi, Pakistan</div>
</div>
</div>
</body>
</html>"""

            text_body = f"""GOFIT - ACTIVE LIFESTYLE

Welcome to GOFIT, {member_name}!

Your membership has been successfully activated.

YOUR LOGIN CREDENTIALS
Username: {username}
Password: {password}

WHAT YOU CAN DO:
- Mark attendance via the mobile app
- View membership details and package info
- Access gym facilities during operating hours

Login at: {frontend_url}/login

Need help? Contact our front desk during operating hours.

GOFIT - Your Partner in Fitness Excellence
(c) 2026 GOFIT Gym Management System, Karachi, Pakistan"""
            
            # Create message
            msg = Message(
                subject=subject,
                sender=sender,
                recipients=[to_email],
                body=text_body,
                html=html_body
            )
            
            # Send email — log full details for debugging
            current_app.logger.info(f"EMAIL: Attempting to send welcome email to {to_email} from {sender}")
            current_app.logger.info(f"EMAIL: MAIL_SERVER={os.getenv('MAIL_SERVER')} PORT={os.getenv('MAIL_PORT')} TLS={os.getenv('MAIL_USE_TLS')}")
            mail.send(msg)
            current_app.logger.info(f"EMAIL: Welcome email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"EMAIL FAILED (welcome): {type(e).__name__}: {str(e)}")
            import traceback
            current_app.logger.error(traceback.format_exc())
            return False
    
    @staticmethod
    def send_password_reset_email(to_email, member_name, reset_token):
        """
        Send password reset email to user.
        
        Args:
            to_email: Member's email address
            member_name: Member's full name
            reset_token: Password reset token
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get config from environment variables directly
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            sender = os.getenv('MAIL_DEFAULT_SENDER') or os.getenv('MAIL_USERNAME')
            
            if not sender:
                current_app.logger.error("No email sender configured. Set MAIL_DEFAULT_SENDER or MAIL_USERNAME in .env")
                return False
            
            reset_link = f"{frontend_url}/reset-password?token={reset_token}"
            
            # Email subject
            subject = "GOFIT - Password Reset Request"
            
            # HTML email template
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #EDEDED;
                        background-color: #0B0B0B;
                        margin: 0;
                        padding: 0;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #1A1A1A;
                        border-radius: 10px;
                    }}
                    .header {{
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #F2C228;
                    }}
                    .logo {{
                        font-size: 32px;
                        font-weight: bold;
                        color: #F2C228;
                    }}
                    .content {{
                        padding: 30px 20px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #F2C228;
                        color: #0B0B0B;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #EDEDED;
                        opacity: 0.6;
                        font-size: 12px;
                        border-top: 1px solid #1A1A1A;
                    }}
                    .warning {{
                        background-color: #2A2A2A;
                        padding: 15px;
                        border-left: 4px solid #F2C228;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">GOFIT</div>
                    </div>
                    <div class="content">
                        <h2 style="color: #F2C228;">Password Reset Request</h2>
                        <p>Hi {member_name},</p>
                        <p>We received a request to reset your password for your GOFIT account. Click the button below to reset your password:</p>
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="button">Reset Password</a>
                        </div>
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <ul>
                                <li>This link will expire in 24 hours</li>
                                <li>If you didn't request this reset, please ignore this email</li>
                                <li>Never share this link with anyone</li>
                            </ul>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #F2C228;">{reset_link}</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 GOFIT Gym Management System</p>
                        <p>Karachi, Pakistan</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Plain text version
            text_body = f"""
            GOFIT - Password Reset Request
            
            Hi {member_name},
            
            We received a request to reset your password for your GOFIT account.
            
            Click the link below to reset your password:
            {reset_link}
            
            Security Notice:
            - This link will expire in 24 hours
            - If you didn't request this reset, please ignore this email
            - Never share this link with anyone
            
            © 2026 GOFIT Gym Management System
            Karachi, Pakistan
            """
            
            # Create message
            msg = Message(
                subject=subject,
                sender=sender,
                recipients=[to_email],
                body=text_body,
                html=html_body
            )
            
            # Send email
            mail.send(msg)
            return True
            
        except Exception as e:
            current_app.logger.error(f"EMAIL FAILED (password reset): {type(e).__name__}: {str(e)}")
            import traceback
            current_app.logger.error(traceback.format_exc())
            return False
