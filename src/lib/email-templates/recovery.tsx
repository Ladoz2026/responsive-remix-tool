import * as React from 'react'

import { Button, Text } from '@react-email/components'

import { EmailLayout, button, text } from './brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <EmailLayout
    preview={`Réinitialisez votre mot de passe ${siteName}`}
    heading="Réinitialisation du mot de passe"
  >
    <Text style={text}>
      Nous avons reçu une demande de réinitialisation du mot de passe de votre
      compte {siteName}. Cliquez sur le bouton ci-dessous pour choisir un
      nouveau mot de passe.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Choisir un nouveau mot de passe
    </Button>
    <Text style={{ ...text, marginTop: '24px' }}>
      Ce lien expire prochainement. Si vous n'avez pas demandé cette
      réinitialisation, ignorez cet e-mail : votre mot de passe reste inchangé.
    </Text>
  </EmailLayout>
)

export default RecoveryEmail
