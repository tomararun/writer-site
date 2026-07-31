import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

/** SPEC §5.4 — the "someone wrote to you" email; reply-to is the sender. */
export function ContactNotification({
  name,
  email,
  topic,
  subject,
  message,
}: {
  name: string;
  email: string;
  topic: string;
  subject?: string | null;
  message: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        {name}: {message.slice(0, 80)}
      </Preview>
      <Body style={{ backgroundColor: "#e6e8ea", fontFamily: "Georgia, serif", margin: 0 }}>
        <Container style={{ padding: "40px 24px", maxWidth: "560px" }}>
          <Heading
            as="h1"
            style={{ fontSize: "18px", color: "#0f1620", fontFamily: "Arial, sans-serif" }}
          >
            New contact message — {topic}
          </Heading>
          <Text style={{ fontSize: "14px", color: "#4c5764", fontFamily: "monospace" }}>
            From: {name} &lt;{email}&gt;
            {subject ? (
              <>
                <br />
                Subject: {subject}
              </>
            ) : null}
          </Text>
          <Hr style={{ borderColor: "#c6ccd1" }} />
          <Text
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#0f1620",
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </Text>
          <Hr style={{ borderColor: "#c6ccd1" }} />
          <Text style={{ fontSize: "13px", color: "#4c5764" }}>
            Reply to this email to answer directly — reply-to is set to the sender.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
