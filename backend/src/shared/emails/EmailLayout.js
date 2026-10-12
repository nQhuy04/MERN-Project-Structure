import { createElement as h } from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

/**
 * Khung email dùng chung (hạ tầng, không chứa nội dung nghiệp vụ).
 * Backend là JavaScript thuần nên không có JSX: `h(Component, props, ...children)` tương
 * đương `<Component {...props}>{children}</Component>`.
 */

export const APP_NAME = 'MERN Base';

const COLORS = { text: '#1f2937', muted: '#6b7280', primary: '#2563eb', border: '#e5e7eb' };

const styles = {
  body: { backgroundColor: '#f3f4f6', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 },
  container: {
    backgroundColor: '#ffffff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    margin: '32px auto',
    maxWidth: '560px',
    padding: '32px',
  },
  brand: { color: COLORS.primary, fontSize: '16px', fontWeight: 'bold', margin: '0 0 24px' },
  heading: { color: COLORS.text, fontSize: '22px', margin: '0 0 16px' },
  paragraph: { color: COLORS.text, fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' },
  buttonSection: { margin: '24px 0' },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 'bold',
    padding: '12px 24px',
    textDecoration: 'none',
  },
  fallback: { color: COLORS.muted, fontSize: '13px', lineHeight: '20px', wordBreak: 'break-all' },
  hr: { borderColor: COLORS.border, margin: '24px 0' },
  footer: { color: COLORS.muted, fontSize: '12px', lineHeight: '18px', margin: 0 },
};

/**
 * @param {Object} props
 * @param {string} props.preview dòng xem trước hiển thị trong hộp thư
 * @param {string} props.heading tiêu đề trong nội dung email
 * @param {*} props.children nội dung
 */
export function EmailLayout({ preview, heading, children }) {
  return h(
    Html,
    { lang: 'vi' },
    h(Head),
    h(Preview, null, preview),
    h(
      Body,
      { style: styles.body },
      h(
        Container,
        { style: styles.container },
        h(Text, { style: styles.brand }, APP_NAME),
        h(Heading, { as: 'h1', style: styles.heading }, heading),
        children,
        h(Hr, { style: styles.hr }),
        h(
          Text,
          { style: styles.footer },
          `Email tự động từ ${APP_NAME}, vui lòng không trả lời email này.`,
        ),
      ),
    ),
  );
}

/** Đoạn văn trong email. */
export function EmailParagraph({ children }) {
  return h(Text, { style: styles.paragraph }, children);
}

/**
 * Nút hành động kèm link dự phòng (một số trình đọc email chặn nút).
 * @param {Object} props
 * @param {string} props.href
 * @param {string} props.children nhãn nút
 */
export function ActionButton({ href, children }) {
  return h(
    Section,
    { style: styles.buttonSection },
    h(Button, { href, style: styles.button }, children),
    h(
      Text,
      { style: styles.fallback },
      'Nếu nút không hoạt động, mở đường dẫn sau: ',
      h(Link, { href }, href),
    ),
  );
}
