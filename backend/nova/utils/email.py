from mailjet_rest import Client
from django.conf import settings

def enviar_correo_mailjet(destinatario, asunto, mensaje_html, mensaje_texto=None):
    mailjet = Client(auth=(settings.MAILJET_API_KEY, settings.MAILJET_API_SECRET), version='v3.1')

    data = {
        'Messages': [
            {
                "From": {
                    "Email": settings.MAILJET_EMAIL_FROM,
                    "Name": "DAGI"
                },
                "To": [
                    {
                        "Email": destinatario,
                        "Name": "Cliente"
                    }
                ],
                "Subject": asunto,
                "TextPart": mensaje_texto or "Este es un mensaje de texto.",
                "HTMLPart": mensaje_html,
                "CustomID": "CorreoDesdeDjango"
            }
        ]
    }

    result = mailjet.send.create(data=data)
    return result.status_code, result.json()
