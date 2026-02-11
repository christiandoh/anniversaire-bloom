function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer py-3">
      <div className="container text-center small text-white-50">
        <div>© {year} Bloom ATC — Anniversaires Bloomers</div>
        <div>Conçu pour une expérience spirituelle, festive et premium.</div>
      </div>
    </footer>
  )
}

export default Footer

