/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail — Supet 🐾</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🐾 Supet</Text>
        </Section>
        <Section style={heroSection}>
          <Text style={heroEmoji}>🎉</Text>
          <Heading style={h1}>Bem-vindo à Supet!</Heading>
          <Text style={text}>
            Que bom ter você por aqui! Para começar a cuidar do seu pet com produtos naturais, confirme seu e-mail
            (<Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>).
          </Text>
        </Section>
        <Hr style={divider} />
        <Section style={ctaSection}>
          <Button style={button} href={confirmationUrl}>Confirmar meu e-mail</Button>
        </Section>
        <Hr style={divider} />
        <Section style={footerSection}>
          <Text style={footer}>Se você não criou uma conta na Supet, pode ignorar este e-mail com segurança.</Text>
          <Text style={footerBrand}>Supet — Cuidado natural para seu pet 🐾</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const B = '#E87B1C', T = '#3D3228', M = '#7A6E63'
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', padding: '0' }
const header = { backgroundColor: B, padding: '24px 32px', borderRadius: '16px 16px 0 0', textAlign: 'center' as const }
const logoText = { color: '#fff', fontSize: '24px', fontWeight: '800' as const, margin: '0', letterSpacing: '1px' }
const heroSection = { padding: '32px 32px 16px', textAlign: 'center' as const }
const heroEmoji = { fontSize: '48px', margin: '0 0 8px' }
const h1 = { fontSize: '26px', fontWeight: '800' as const, color: T, margin: '0 0 12px' }
const text = { fontSize: '15px', color: M, lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: B, textDecoration: 'underline' }
const divider = { borderColor: '#F0E8E0', margin: '0 32px' }
const ctaSection = { textAlign: 'center' as const, padding: '24px 32px' }
const button = { backgroundColor: B, color: '#fff', fontSize: '15px', borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', fontWeight: '700' as const, display: 'inline-block' }
const footerSection = { padding: '16px 32px 32px', textAlign: 'center' as const }
const footer = { fontSize: '13px', color: M, margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#C4B5A5', margin: '0' }
