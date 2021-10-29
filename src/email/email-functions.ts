import sendgrid from '@sendgrid/mail';

// this is mostly copied from
// https://stackoverflow.com/questions/28899298/
function htmlToPlainText(html: string) {
    const span: HTMLSpanElement = document.createElement('span');

    span.innerHTML = html;
    return span.textContent || span.innerText;
}

// this is largely based on https://simple-hack.com/sendgrid
// (not used at the moment, but left for future reference)
export function sendHTMLGridMail(
    toEmail: string,
    fromEmail: string,
    subject: string,
    bodyHTML: string,
    bodyRawTxt?: string
) {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: toEmail,
        from: fromEmail,
        subject: subject,
        html: bodyHTML,
        text: bodyRawTxt || htmlToPlainText(bodyHTML)
    };

    sendgrid
        .send(msg)
        .then(() => {
            console.log('Email sent');
        })
        .catch((error) => {
            console.error(error);
        });
}

// makes use of SendGrid dynamic templates
export function sendDocRegistrationInviteMail(
    toEmail: string,
    inviter: string,
    documentName: string,
    registrationUrl: string,
    inviteKey: string
) {
    try {
        sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    } catch (e) {
        console.error('failed at setting up API key');
        console.error(e);
    }

    const msg: any = {
        from: process.env.SENDGRID_FROM_EMAIL,
        template_id: process.env.SENDGRID_DOCINVITE_TEMPLATE_ID,
        personalizations: [{
            to: { email: toEmail },
            dynamic_template_data: {
                inviter: inviter,
                document_name: documentName,
                registration_url: registrationUrl,
                doc_invite_key_param: inviteKey
            }
        }]
    };

    return sendgrid.send(msg);
}
