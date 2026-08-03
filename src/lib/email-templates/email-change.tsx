import * as React from 'react'

import { Button, Link, Text } from '@react-email/components'

import { EmailLayout, button, link, text } from './brand'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailLayout
    preview={`Confirmez le changement d'e-mail de votre compte ${siteName}`}
    heading="Confirmer votre nouvelle adresse"
  >
    <Text style={text}>
      Vous avez demandé à modifier l'adresse e-mail de votre compte {siteName},
      de{' '}
      <Link href={`mailto:${oldEmail}`} style={link}>
        {oldEmail}
      </Link>{' '}
      vers{' '}
      <Link href={`mailto:${newEmail}`} style={link}>
        {newEmail}
      </Link>
      .
    </Text>
    <Button style={button} href={confirmationUrl}>
      Confirmer le changement
    </Button>
    <Text style={{ ...text, marginTop: '24px' }}>
      Si vous n'êtes pas à l'origine de cette demande, sécurisez votre compte
      immédiatement en changeant votre mot de passe.
    </Text>
  </EmailLayout>
)

export default EmailChangeEmail
