type FooterProps = {
  note: string
  className?: string
}

export default function Footer({ note, className = "" }: FooterProps) {
  return (
    <footer className={`site-footer ${className}`}>
      <div className="footer-identity">
        <span className="footer-mark" aria-hidden="true">
          f.
        </span>
        <strong>Forma</strong>
      </div>
      <span className="footer-environment">
        <span aria-hidden="true" />
        Demo environment
      </span>
      <small className="footer-copyright">
        © {new Date().getFullYear()} Forma
      </small>
      <p className="footer-disclosure">{note}</p>
    </footer>
  )
}
