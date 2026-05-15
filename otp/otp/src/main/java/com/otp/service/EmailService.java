package com.otp.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String fromEmail;
    @Value("${app.name:MyApp}")
    private String appName;
    @Value("${app.otp.expiry-minutes:5")
    private int expiryMinutes;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, appName);
            helper.setTo(toEmail);
            helper.setSubject(appName + " - Your verification code");
            helper.setText(buildEmailBody(otp), true); // true - send as html
            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}", toEmail, e);
            throw new RuntimeException("Email delivery failed", e);
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}", toEmail, e);
            throw new RuntimeException("Email delivery failed", e);
        }
    }

    private String buildEmailBody(String otp) {
        String digits = otp.chars()
                .mapToObj(c -> "<span style='" +
                        "display:inline-block;" +
                        "width:48px;height:56px;" +
                        "line-height:56px;" +
                        "text-align:center;" +
                        "font-size:28px;" +
                        "font-weight:700;" +
                        "letter-spacing:0;" +
                        "border:2px solid #e2e8f0;" +
                        "border-radius:8px;" +
                        "margin:0 4px;" +
                        "color:#1a202c;" +
                        "background:#f8fafc;" +
                        "'>" + (char) c + "</span>")
                .reduce("", String::concat);
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
                    <tr>
                      <td align="center">
                        <table width="520" cellpadding="0" cellspacing="0"
                               style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                
                          <!-- Header -->
                          <tr>
                            <td style="background:#0f172a;padding:28px 40px;text-align:center;">
                              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">%s</p>
                            </td>
                          </tr>
                
                          <!-- Body -->
                          <tr>
                            <td style="padding:40px;">
                              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#0f172a;">
                                Verify your identity
                              </p>
                              <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6;">
                                Use the code below to complete your verification.
                                It expires in <strong>%d minutes</strong> and can only be used once.
                              </p>
                
                              <!-- OTP digits -->
                              <div style="text-align:center;margin:0 0 32px;">
                                %s
                              </div>
                
                              <!-- Warning box -->
                              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;">
                                <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.5;">
                                  ⚠️ Never share this code with anyone.
                                  %s will never ask for your OTP via phone or chat.
                                </p>
                              </div>
                            </td>
                          </tr>
                
                          <!-- Footer -->
                          <tr>
                            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
                              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                                If you didn't request this, you can safely ignore this email.
                              </p>
                            </td>
                          </tr>
                
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(appName, expiryMinutes, digits, appName);
    }

}
