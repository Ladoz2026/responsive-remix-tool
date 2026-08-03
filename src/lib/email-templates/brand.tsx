import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export const BRAND = {
  name: 'SeLoger CI',
  navy: '#0B1F3A',
  navySoft: '#14294a',
  gold: '#C9A227',
  goldDark: '#A8871B',
  text: '#3d4453',
  muted: '#8a909c',
  border: '#e6e8ee',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '0',
}

export const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 0 32px',
}

export const header = {
  backgroundColor: BRAND.navy,
  borderRadius: '0 0 20px 20px',
  padding: '28px 32px',
  textAlign: 'center' as const,
}

export const brandText = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.5px',
  margin: '0',
}

export const brandAccent = { color: BRAND.gold }

export const tagline = {
  color: '#b9c3d4',
  fontSize: '11px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  margin: '6px 0 0',
}

export const content = { padding: '32px 32px 8px' }

export const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: BRAND.navy,
  margin: '0 0 18px',
  lineHeight: '1.3',
}

export const text = {
  fontSize: '15px',
  color: BRAND.text,
  lineHeight: '1.6',
  margin: '0 0 20px',
}

export const link = { color: BRAND.navy, textDecoration: 'underline' }

export const button = {
  backgroundColor: BRAND.gold,
  color: '#12203a',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  letterSpacing: '6px',
  fontWeight: 'bold' as const,
  color: BRAND.navy,
  backgroundColor: '#f4f6fa',
  borderRadius: '14px',
  padding: '18px 20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

export const hr = { borderColor: BRAND.border, margin: '28px 0 16px' }

export const footer = {
  fontSize: '12px',
  color: BRAND.muted,
  lineHeight: '1.6',
  margin: '0 0 6px',
  padding: '0 32px',
}

export function EmailLayout({
  preview,
  heading,
  children,
}: {
  preview: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>
              SeLoger<span style={brandAccent}> CI</span>
            </Text>
            <Text style={tagline}>Immobilier vérifié en Côte d'Ivoire</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>{heading}</Heading>
            {children}
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            {BRAND.name} — la plateforme immobilière de référence en Côte
            d'Ivoire.
          </Text>
          <Text style={footer}>
            Cet e-mail vous a été envoyé automatiquement, merci de ne pas y
            répondre.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
