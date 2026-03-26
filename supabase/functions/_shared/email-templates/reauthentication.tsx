/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação — Supet</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={logoText}>🐾 Supet</Text></Section>
        <Section style={heroSection}>
          <Text style={heroEmoji}>🔑</Text>
          <Heading style={h1}>Código de verificação</Heading>
          <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={divider} />
        <Section style={footerSection}>
          <Text style={footer}>Este código expira em alguns minutos. Se você não solicitou, pode ignorar este e-mail.</Text>
          <Text style={footerBrand}>Supet — Cuidado natural para seu pet 🐾</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const B = '#E87B1C', T = '#3D3228', M = '#7A6E63'
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', padding: '0' }
const header = { backgroundColor: B, padding: '24px 32px', borderRadius: '16px 16px 0 0', textAlign: 'center' as const }
const logoText = { color: '#fff', fontSize: '24px', fontWeight: '800' as const, margin: '0', letterSpacing: '1px' }
const heroSection = { padding: '32px 32px 16px', textAlign: 'center' as const }
const heroEmoji = { fontSize: '48px', margin: '0 0 8px' }
const h1 = { fontSize: '26px', fontWeight: '800' as const, color: T, margin: '0 0 12px' }
const text = { fontSize: '15px', color: M, lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: "'Courier New', monospace", fontSize: '32px', fontWeight: '800' as const, color: B, letterSpacing: '6px', margin: '0 0 24px', textAlign: 'center' as const }
const divider = { borderColor: '#F0E8E0', margin: '0 32px' }
const footerSection = { padding: '16px 32px 32px', textAlign: 'center' as const }
const footer = { fontSize: '13px', color: M, margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#C4B5A5', margin: '0' }
