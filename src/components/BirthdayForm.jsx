import { useState } from 'react'
import { motion } from 'framer-motion'
import { submitBirthday } from '../services/api.js'

const initialState = {
  fullName: '',
  day: '',
  month: '',
  whatsapp: '',
  photo: null,
}

function BirthdayForm() {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [apiError, setApiError] = useState('')

  const validate = (fieldValues = form) => {
    const newErrors = { ...errors }

    if ('fullName' in fieldValues) {
      if (!fieldValues.fullName.trim()) {
        newErrors.fullName = 'Le nom complet est obligatoire.'
      } else {
        delete newErrors.fullName
      }
    }

    if ('day' in fieldValues) {
      const day = Number(fieldValues.day)
      if (!day || day < 1 || day > 31) {
        newErrors.day = 'Le jour doit être compris entre 1 et 31.'
      } else {
        delete newErrors.day
      }
    }

    if ('month' in fieldValues) {
      const month = Number(fieldValues.month)
      if (!month || month < 1 || month > 12) {
        newErrors.month = 'Le mois doit être compris entre 1 et 12.'
      } else {
        delete newErrors.month
      }
    }

    if ('photo' in fieldValues) {
      if (!fieldValues.photo) {
        newErrors.photo = 'La photo est obligatoire.'
      } else {
        delete newErrors.photo
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    validate({ [name]: value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    const updated = { ...form, photo: file }
    setForm(updated)
    validate({ photo: file })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    setApiError('')

    if (!validate(form)) return

    try {
      setIsSubmitting(true)

      const trimmedName = form.fullName.trim()

      await submitBirthday({
        fullName: trimmedName,
        day: form.day.trim(),
        month: form.month.trim(),
        whatsapp: form.whatsapp.trim(),
        photo: form.photo,
      })

      setSuccessMessage(
        `Merci ${trimmedName} ! Ton anniversaire a bien été enregistré. Nous célébrerons avec toi en temps voulu ✨`,
      )
      setForm(initialState)
      setErrors({})
    } catch (err) {
      console.error(err)
      setApiError(
        "Une erreur est survenue lors de l'enregistrement. Merci de réessayer dans quelques instants.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="form-title mb-3 text-center">
        Partage ton anniversaire ✨
      </h2>
      <p className="text-center text-white-50 mb-4">
        Remplis ce formulaire pour que la famille Bloom ATC puisse célébrer ton
        jour spécial avec amour et excellence.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label text-white" htmlFor="fullName">
            Nom complet *
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className={`form-control ${
              errors.fullName ? 'is-invalid' : 'border-0'
            }`}
            placeholder="Ex : Marie Grace K."
            value={form.fullName}
            onChange={handleChange}
          />
          {errors.fullName && (
            <div className="invalid-feedback">{errors.fullName}</div>
          )}
        </div>

        <div className="row">
          <div className="col-6 mb-3">
            <label className="form-label text-white" htmlFor="day">
              Jour *
            </label>
            <input
              id="day"
              name="day"
              type="number"
              min="1"
              max="31"
              className={`form-control ${errors.day ? 'is-invalid' : 'border-0'}`}
              placeholder="1 - 31"
              value={form.day}
              onChange={handleChange}
            />
            {errors.day && (
              <div className="invalid-feedback">{errors.day}</div>
            )}
          </div>

          <div className="col-6 mb-3">
            <label className="form-label text-white" htmlFor="month">
              Mois *
            </label>
            <input
              id="month"
              name="month"
              type="number"
              min="1"
              max="12"
              className={`form-control ${
                errors.month ? 'is-invalid' : 'border-0'
              }`}
              placeholder="1 - 12"
              value={form.month}
              onChange={handleChange}
            />
            {errors.month && (
              <div className="invalid-feedback">{errors.month}</div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label text-white" htmlFor="photo">
            Photo (portrait) *
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className={`form-control ${errors.photo ? 'is-invalid' : 'border-0'}`}
            onChange={handleFileChange}
          />
          {errors.photo && (
            <div className="invalid-feedback">{errors.photo}</div>
          )}
          <div className="form-text text-white-50">
            Choisis une belle photo de toi, lumineuse et souriante.
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label text-white" htmlFor="whatsapp">
            Numéro WhatsApp (optionnel)
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            className="form-control border-0"
            placeholder="Ex : +2250700000000"
            value={form.whatsapp}
            onChange={handleChange}
          />
          <div className="form-text text-white-50">
            Format international conseillé pour les notifications WhatsApp.
          </div>
        </div>

        {apiError && (
          <div className="alert alert-danger py-2 mb-3">{apiError}</div>
        )}

        {successMessage && (
          <motion.div
            className="alert alert-success glass-alert mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {successMessage}
          </motion.div>
        )}

        <div className="d-grid">
          <button
            type="submit"
            className="btn btn-primary btn-lg rounded-pill submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span>Enregistrement en cours...</span>
              </span>
            ) : (
              'Enregistrer mon anniversaire'
            )}
          </button>
        </div>

        <p className="mt-3 text-center text-white-50 small">
          En validant, tu autorises Bloom ATC à conserver ces informations pour
          te célébrer avec respect et bienveillance.
        </p>
      </form>
    </motion.div>
  )
}

export default BirthdayForm

