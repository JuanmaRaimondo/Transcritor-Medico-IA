package com.transcriptor.BackEnd.services;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.Entities.Usuario;

@Service
public class ExportService {

    @Autowired
    private UsuarioService usuarioService;

    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Arma el texto corrido final: procedimiento + interpretación, SIN ningún subtítulo entre medio
    private String armarCuerpo(InformeMedico informe){
        StringBuilder cuerpo = new StringBuilder();
        if (informe.getProcedimiento() != null && !informe.getProcedimiento().isBlank()) {
            cuerpo.append(informe.getProcedimiento()).append("\n\n");
        }
        cuerpo.append(informe.getTextoCorregido());
        return cuerpo.toString();
    }

    private Usuario buscarMedico(String emailMedico){
        return (Usuario) usuarioService.loadUserByUsername(emailMedico);
    }

    public byte[] generarDocx(InformeMedico informe) throws Exception {
        Usuario medico = buscarMedico(informe.getIdMedico());
        String cuerpo = armarCuerpo(informe);

        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            agregarLineaEncabezado(doc, "Paciente: " + informe.getNombrePaciente() + " " + informe.getApellidoPaciente());
            agregarLineaEncabezado(doc, "Médico: " + medico.getNombre() + " " + medico.getApellido());
            agregarLineaEncabezado(doc, "Fecha: " + informe.getFechaCreacion().format(FORMATO_FECHA));
            agregarLineaEncabezado(doc, "Estudio: " + informe.getTipoEstudio());

            doc.createParagraph(); // línea en blanco antes del cuerpo

            for (String linea : cuerpo.split("\n")) {
                XWPFParagraph p = doc.createParagraph();
                p.setAlignment(ParagraphAlignment.BOTH); // justificado, prolijo tipo hoja impresa
                XWPFRun run = p.createRun();
                run.setFontFamily("Calibri");
                run.setFontSize(11);
                run.setText(linea);
            }

            doc.createParagraph();
            doc.createParagraph();

            XWPFParagraph firmaNombre = doc.createParagraph();
            firmaNombre.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun runFirmaNombre = firmaNombre.createRun();
            runFirmaNombre.setBold(true);
            runFirmaNombre.setText("Dr/a. " + medico.getNombre() + " " + medico.getApellido());

            XWPFParagraph firmaMatricula = doc.createParagraph();
            firmaMatricula.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun runFirmaMatricula = firmaMatricula.createRun();
            runFirmaMatricula.setFontSize(10);
            runFirmaMatricula.setText(medico.getMatricula() != null ? "M.P. " + medico.getMatricula() : "");

            doc.write(out);
            return out.toByteArray();
        }
    }

    private void agregarLineaEncabezado(XWPFDocument doc, String texto){
        XWPFParagraph p = doc.createParagraph();
        XWPFRun run = p.createRun();
        run.setFontFamily("Calibri");
        run.setFontSize(11);
        run.setText(texto);
    }

    public byte[] generarPdf(InformeMedico informe) throws Exception {
        Usuario medico = buscarMedico(informe.getIdMedico());
        String cuerpo = armarCuerpo(informe).replace("\n", "<br/>");

        String html = """
            <html>
            <head>
            <style>
                body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #111; margin: 60px; }
                .encabezado p { margin: 2px 0; }
                .cuerpo { margin-top: 24px; text-align: justify; line-height: 1.5; }
                .firma { margin-top: 60px; text-align: center; }
                .firma .nombre { font-weight: bold; }
                .firma .matricula { font-size: 10px; }
            </style>
            </head>
            <body>
                <div class="encabezado">
                    <p>Paciente: %s %s</p>
                    <p>Médico: %s %s</p>
                    <p>Fecha: %s</p>
                    <p>Estudio: %s</p>
                </div>
                <div class="cuerpo">%s</div>
                <div class="firma">
                    <p class="nombre">Dr/a. %s %s</p>
                    <p class="matricula">%s</p>
                </div>
            </body>
            </html>
            """.formatted(
                informe.getNombrePaciente(), informe.getApellidoPaciente(),
                medico.getNombre(), medico.getApellido(),
                informe.getFechaCreacion().format(FORMATO_FECHA),
                informe.getTipoEstudio(),
                cuerpo,
                medico.getNombre(), medico.getApellido(),
                medico.getMatricula() != null ? "M.P. " + medico.getMatricula() : ""
            );

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        }
    }
}