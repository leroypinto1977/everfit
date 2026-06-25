/**
 * Passthrough wrapper. (Previously made buttons follow the cursor on hover,
 * but the brand prefers buttons that stay put.) Renders children directly so
 * it imposes no layout of its own — block buttons keep their full width.
 */
export default function Magnetic({
  children,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  return <>{children}</>;
}
