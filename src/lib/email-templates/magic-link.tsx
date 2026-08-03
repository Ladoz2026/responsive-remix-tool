import * as React from 'react'

import { Button, Text } from '@react-email/components'

import { EmailLayout, button, text } from './brand'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <EmailLayout
    preview={`Votre lien de connexion ${siteName}`}
    heading="Votre lien de connexion"
  >
    <Text style={text}>
      Cliquez sur le bouton ci-dessous pour vous connecter à {siteName}. Ce
      lien est à usage unique et expire prochainement.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Me connecter
    </Button>
    <Text style={{ ...text, marginTop: '24px' }}>
      Si vous n'avez pas demandé ce lien, ignorez simplement cet e-mail.
    </Text>
  </EmailLayout>
)

export default MagicLinkEmail
