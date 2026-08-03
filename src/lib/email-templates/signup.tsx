import * as React from 'react'

import { Button, Link, Text } from '@react-email/components'

import { EmailLayout, button, link, text } from './brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <EmailLayout
    preview={`Confirmez votre adresse e-mail pour ${siteName}`}
    heading="Bienvenue sur SeLoger CI"
  >
    <Text style={text}>
      Merci d'avoir créé votre compte sur{' '}
      <Link href={siteUrl} style={link}>
        <strong>{siteName}</strong>
      </Link>
      . Vous pouvez dès maintenant rechercher des biens vérifiés, enregistrer
      vos favoris, créer des alertes et publier vos annonces.
    </Text>
    <Text style={text}>
      Dernière étape : confirmez votre adresse{' '}
      <Link href={`mailto:${recipient}`} style={link}>
        {recipient}
      </Link>{' '}
      en cliquant sur le bouton ci-dessous.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Confirmer mon compte
    </Button>
    <Text style={{ ...text, marginTop: '24px' }}>
      Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement
      cet e-mail.
    </Text>
  </EmailLayout>
)

export default SignupEmail
