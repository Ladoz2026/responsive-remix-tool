import * as React from 'react'

import { Button, Link, Text } from '@react-email/components'

import { EmailLayout, button, link, text } from './brand'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <EmailLayout
    preview={`Vous êtes invité à rejoindre ${siteName}`}
    heading="Vous êtes invité"
  >
    <Text style={text}>
      Vous avez été invité à rejoindre{' '}
      <Link href={siteUrl} style={link}>
        <strong>{siteName}</strong>
      </Link>
      . Acceptez l'invitation pour créer votre compte et accéder à la
      plateforme.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Accepter l'invitation
    </Button>
    <Text style={{ ...text, marginTop: '24px' }}>
      Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail.
    </Text>
  </EmailLayout>
)

export default InviteEmail
