import * as React from 'react'

import { Text } from '@react-email/components'

import { EmailLayout, codeStyle, text } from './brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({
  token,
}: ReauthenticationEmailProps) => (
  <EmailLayout
    preview="Votre code de vérification SeLoger CI"
    heading="Confirmez votre identité"
  >
    <Text style={text}>
      Utilisez le code ci-dessous pour confirmer votre identité :
    </Text>
    <Text style={codeStyle}>{token}</Text>
    <Text style={text}>
      Ce code expire dans quelques minutes. Si vous n'êtes pas à l'origine de
      cette demande, ignorez cet e-mail.
    </Text>
  </EmailLayout>
)

export default ReauthenticationEmail
