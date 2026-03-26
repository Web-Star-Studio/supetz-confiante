import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Row, Column, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Supet"
const BRAND_COLOR = "#E87B1C"
const TEXT_COLOR = "#3D3228"
const MUTED_COLOR = "#7A6E63"
const BG_ACCENT = "#FFF7ED"

const STATUS_CONFIG: Record<string, { emoji: string; label: string; message: string; color: string }> = {
  confirmed: {
    emoji: '✅',
    label: 'Confirmado',
    message: 'Seu pedido foi confirmado e está sendo preparado com carinho!',
    color: '#0EA5E9',
  },
  shipped: {
    emoji: '🚚',
    label: 'Enviado',
    message: 'Seu pedido está a caminho! Em breve chegará ao destino.',
    color: '#8B5CF6',
  },
  delivered: {
    emoji: '🎉',
    label: 'Entregue',
    message: 'Seu pedido foi entregue! Esperamos que seu pet aproveite muito.',
    color: '#10B981',
  },
  cancelled: {
    emoji: '❌',
    label: 'Cancelado',
    message: 'Seu pedido foi cancelado. Se precisar de ajuda, entre em contato conosco.',
    color: '#EF4444',
  },
}

interface OrderStatusUpdateProps {
  customerName?: string
  orderId?: string
  status?: string
  total?: string
}

const OrderStatusUpdateEmail = ({
  customerName,
  orderId,
  status,
  total,
}: OrderStatusUpdateProps) => {
  const displayName = customerName || 'Cliente'
  const displayId = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : '#—'
  const config = STATUS_CONFIG[status || 'confirmed'] || STATUS_CONFIG.confirmed

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Pedido {displayId} — {config.label} {config.emoji}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>🐾 Supet</Text>
          </Section>

          {/* Status Badge */}
          <Section style={heroSection}>
            <Text style={heroEmoji}>{config.emoji}</Text>
            <Heading style={h1}>Pedido {config.label}</Heading>
            <Text style={heroSubtext}>
              Olá, <strong>{displayName}</strong>! {config.message}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Order Info Card */}
          <Section style={cardSection}>
            <Row>
              <Column>
                <Text style={labelText}>Pedido</Text>
                <Text style={valueText}>{displayId}</Text>
              </Column>
              <Column>
                <Text style={labelText}>Status</Text>
                <Text style={{ ...statusBadgeText, color: config.color }}>● {config.label}</Text>
              </Column>
              {total && (
                <Column>
                  <Text style={labelText}>Total</Text>
                  <Text style={valueText}>R$ {total}</Text>
                </Column>
              )}
            </Row>
          </Section>

          {/* Status Timeline */}
          <Section style={timelineSection}>
            <Text style={cardTitle}>Acompanhamento</Text>
            {['confirmed', 'shipped', 'delivered'].map((step) => {
              const stepConfig = STATUS_CONFIG[step]
              const isActive = step === status
              const isPast = getStepIndex(status || '') >= getStepIndex(step)
              return (
                <Row key={step} style={timelineRow}>
                  <Column style={{ width: '40px' }}>
                    <Text style={{
                      ...timelineDot,
                      backgroundColor: isPast ? config.color : '#E5DDD5',
                      color: isPast ? '#ffffff' : MUTED_COLOR,
                    }}>
                      {isPast ? '✓' : stepConfig.emoji}
                    </Text>
                  </Column>
                  <Column>
                    <Text style={{
                      ...timelineLabel,
                      fontWeight: isActive ? '700' as const : '400' as const,
                      color: isPast ? TEXT_COLOR : '#C4B5A5',
                    }}>
                      {stepConfig.label}
                    </Text>
                  </Column>
                </Row>
              )
            })}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href="https://supet.com.br/perfil">
              Ver detalhes do pedido
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerText}>
              Dúvidas? Responda este e-mail ou entre em contato pelo nosso site.
            </Text>
            <Text style={footerBrand}>
              Supet — Cuidado natural para seu pet 🐾
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function getStepIndex(status: string): number {
  const steps = ['pending', 'confirmed', 'shipped', 'delivered']
  return steps.indexOf(status)
}

export const template = {
  component: OrderStatusUpdateEmail,
  subject: (data: Record<string, any>) => {
    const config = STATUS_CONFIG[data.status || 'confirmed'] || STATUS_CONFIG.confirmed
    const id = data.orderId ? '#' + data.orderId.slice(0, 8).toUpperCase() : ''
    return `${config.emoji} Pedido ${id} — ${config.label}`
  },
  displayName: 'Atualização de status do pedido',
  previewData: {
    customerName: 'Maria Silva',
    orderId: 'abc12345-6789-0000-1111-222233334444',
    status: 'shipped',
    total: '189,90',
  },
} satisfies TemplateEntry

// ─── Styles ────────────────────────────────────────────────
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', padding: '0' }

const header = {
  backgroundColor: BRAND_COLOR,
  padding: '24px 32px',
  borderRadius: '16px 16px 0 0',
  textAlign: 'center' as const,
}
const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '800' as const,
  margin: '0',
  letterSpacing: '1px',
}

const heroSection = { padding: '32px 32px 16px', textAlign: 'center' as const }
const heroEmoji = { fontSize: '48px', margin: '0 0 8px' }
const h1 = { fontSize: '26px', fontWeight: '800' as const, color: TEXT_COLOR, margin: '0 0 12px' }
const heroSubtext = { fontSize: '15px', color: MUTED_COLOR, lineHeight: '1.6', margin: '0' }

const divider = { borderColor: '#F0E8E0', margin: '0 32px' }

const cardSection = {
  backgroundColor: BG_ACCENT,
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '16px 32px',
}
const cardTitle = {
  fontSize: '13px',
  fontWeight: '700' as const,
  color: BRAND_COLOR,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 16px',
}
const labelText = { fontSize: '11px', color: MUTED_COLOR, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px' }
const valueText = { fontSize: '15px', fontWeight: '600' as const, color: TEXT_COLOR, margin: '0 0 8px' }
const statusBadgeText = { fontSize: '15px', fontWeight: '700' as const, margin: '0 0 8px' }

const timelineSection = {
  backgroundColor: BG_ACCENT,
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '8px 32px 16px',
}
const timelineRow = { marginBottom: '12px' }
const timelineDot = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  fontSize: '12px',
  textAlign: 'center' as const,
  lineHeight: '28px',
  margin: '0',
}
const timelineLabel = { fontSize: '14px', color: TEXT_COLOR, margin: '4px 0 0' }

const ctaSection = { textAlign: 'center' as const, padding: '8px 32px 24px' }
const ctaButton = {
  backgroundColor: BRAND_COLOR,
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '12px',
  fontWeight: '700' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footerSection = { padding: '16px 32px 32px', textAlign: 'center' as const }
const footerText = { fontSize: '13px', color: MUTED_COLOR, margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#C4B5A5', margin: '0' }
