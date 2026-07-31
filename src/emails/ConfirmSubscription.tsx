import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

/**
 * SPEC §6.12 — the double opt-in email. Plain, honest, one action. Inline
 * styles only (email clients); the palette echoes the site without depending
 * on it.
 */
export function ConfirmSubscription({
  confirmUrl,
  siteName,
}: {
  confirmUrl: string;
  siteName: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>One click and you&rsquo;re on the list.</Preview>
      <Body style={{ backgroundColor: "#e6e8ea", fontFamily: "Georgia, serif", margin: 0 }}>
        <Container style={{ padding: "40px 24px", maxWidth: "520px" }}>
          <Heading
            as="h1"
            style={{ fontSize: "22px", color: "#0f1620", fontFamily: "Arial, sans-serif" }}
          >
            Confirm your subscription
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "1.6", color: "#0f1620" }}>
            You (or someone typing your email) asked to get the letter from {siteName} — one
            essay, three things worth reading, and one open problem, every other Sunday.
          </Text>
          <Button
            href={confirmUrl}
            style={{
              backgroundColor: "#1d3fa8",
              color: "#e6e8ea",
              padding: "12px 20px",
              fontFamily: "Arial, sans-serif",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            Confirm subscription
          </Button>
          <Text style={{ fontSize: "13px", lineHeight: "1.6", color: "#4c5764" }}>
            The link works for 48 hours. If you didn&rsquo;t ask for this, ignore it — nothing
            happens without the click. Button not working? Paste this into your browser:
            <br />
            <Link href={confirmUrl} style={{ color: "#1d3fa8", wordBreak: "break-all" }}>
              {confirmUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
