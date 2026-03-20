import React, { useState } from 'react';
import Header from '../components/Header';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const faqData = [
  {
    question: "¿Cómo genero un nuevo informe médico?",
    answer: "Podés ir al Dashboard principal y hacer clic en el botón 'Nuevo Informe'. Ahí tendrás la opción de grabar el audio de la consulta directamente o subir un archivo de audio (.mp3 o .wav). Una vez cargado, hacé clic en 'Procesar con IA' para enviar el audio a los servidores."
  },
  {
    question: "¿Qué hace la Inteligencia Artificial con mi grabación?",
    answer: "La IA (impulsada por Vertex AI / Gemini) analiza la transcripción médica y extrae de forma estructurada los apartados más importantes: Motivo de consulta, Enfermedad actual, Examen físico, entre otros. Convierte un diálogo o relato desordenado en un informe médico ordenado y profesional."
  },
  {
    question: "¿Puedo editar el informe generado por la IA?",
    answer: "Sí, todos los informes empiezan en estado 'PENDIENTE_REVISION'. Al hacer clic en 'Revisar' vas a ver la pantalla dividida: a la izquierda la transcripción cruda original, y a la derecha el informe estructurado generado por la IA en un área editable. Para tu comodidad, la IA ahora organiza la información extraída y te la presenta en formato de texto plano listo para revisar y editar libremente."
  },
  {
    question: "¿Cómo exporto el informe a PDF o finalizo el proceso?",
    answer: "En la pantalla de Revisión podés utilizar el botón secundario 'Descargar PDF' para generar y guardar el documento en tu computadora de manera instantánea sin formato extraño (utiliza un membrete automático). Una vez que el informe esté perfecto, hacé clic en el botón principal 'Aprobar y Finalizar Informe' para dejarlo guardado como 'REVISADO' e imposibilitar futuras modificaciones."
  },
  {
    question: "¿Están seguros los datos de mis pacientes?",
    answer: "El sistema trabaja con seguridad y accesos autenticados a través de JWT. Te recomendamos siempre anonimizar nombres sensibles de pacientes previo a grabar los audios según la política de tu institución de salud pertinente, utilizar sólo la plataforma bajo un entorno confiable y recordar que la IA actúa en todo momento como soporte para tu labor médica sin reemplazar tu revisión final profesional."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Header />
      <main className="page-wrapper bg-color">
        <div className="container" style={{ maxWidth: '800px', padding: '2rem' }}>
          
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={32} className="text-primary" />
            <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Preguntas Frecuentes y Ayuda</h1>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            A continuación, encontrarás respuestas a las dudas comunes sobre cómo funciona Transcriptor Médico IA. Acá te explicamos todos los pasos desde subir tu audio hasta lograr una historia clínica estructurada y descargada en PDF.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqData.map((item, index) => (
              <div 
                key={index} 
                className="card" 
                style={{ 
                  padding: '0', 
                  overflow: 'hidden', 
                  border: openIndex === index ? '1px solid var(--primary-light)' : '1px solid var(--border)',
                  boxShadow: openIndex === index ? 'var(--shadow-md)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div 
                  className="flex justify-between items-center" 
                  onClick={() => toggleAccordion(index)}
                  style={{ 
                    padding: '1.5rem', 
                    cursor: 'pointer', 
                    backgroundColor: openIndex === index ? '#f0f4ff' : 'transparent',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.15rem', margin: 0, color: openIndex === index ? 'var(--primary)' : 'var(--text-primary)', fontWeight: '600' }}>
                    {item.question}
                  </h3>
                  {openIndex === index ? <ChevronUp className="text-primary" size={24} /> : <ChevronDown className="text-secondary" size={24} />}
                </div>

                {openIndex === index && (
                  <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          
        </div>
      </main>
    </>
  );
};

export default FAQ;
