/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinir sua senha — Supet 🐾</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={logoText}>🐾 Supet</Text></Section>
        <Section style={heroSection}>
          <Text style={heroEmoji}>🔐</Text>
          <Heading style={h1}>Redefinir sua senha</Heading>
          <Text style={text}>Recebemos uma solicitação para redefinir a senha da sua conta na Supet. Clique no botão abaixo para criar uma nova senha.</Text>
        </Section>
        <Hr style={divider} />
        <Section style={ctaSection}><Button style={button} href={confirmationUrl}>Redefinir senha</Button></Section>
        <Hr style={divider} />
        <Section style={footerSection}>
          <Text style={footer}>Se você não solicitou a redefinição de senha, pode ignorar este e-mail. Sua senha não será alterada.</Text>
          <Text style={footerBrand}>Supet — Cuidado natural para seu pet 🐾</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const B = '#E87B1C', T = '#3D3228', M = '#7A6E63'
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', padding: '0' }
const header = { backgroundColor: B, padding: '24px 32px', borderRadius: '16px 16px 0 0', textAlign: 'center' as const }
const logoText = { color: '#fff', fontSize: '24px', fontWeight: '800' as const, margin: '0', letterSpacing: '1px' }
const heroSection = { padding: '32px 32px 16px', textAlign: 'center' as const }
const heroEmoji = { fontSize: '48px', margin: '0 0 8px' }
const h1 = { fontSize: '26px', fontWeight: '800' as const, color: T, margin: '0 0 12px' }
const text = { fontSize: '15px', color: M, lineHeight: '1.6', margin: '0 0 20px' }
const divider = { borderColor: '#F0E8E0', margin: '0 32px' }
const ctaSection = { textAlign: 'center' as const, padding: '24px 32px' }
const button = { backgroundColor: B, color: '#fff', fontSize: '15px', borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', fontWeight: '700' as const, display: 'inline-block' }
const footerSection = { padding: '16px 32px 32px', textAlign: 'center' as const }
const footer = { fontSize: '13px', color: M, margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#C4B5A5', margin: '0' }
