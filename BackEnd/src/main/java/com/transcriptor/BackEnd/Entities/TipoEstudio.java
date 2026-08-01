package com.transcriptor.BackEnd.Entities;

public enum TipoEstudio {

    // Tomografías Computadas
    TC_CRANEO("TC de Cráneo"),
    TC_MACIZO_FACIAL_SENOS_PARANASALES("TC Macizo Facial y Senos Paranasales"),
    TC_ABDOMEN_PELVIS("TC de Abdomen y Pelvis"),
    TC_TORAX("TC de Tórax"),
    TC_CEREBRO("TC de Cerebro"),
    TC_CUELLO("TC de Cuello"),
    TC_COLUMNA_DORSAL("TC de Columna Dorsal"),
    TC_COLUMNA_LUMBAR("TC de Columna Lumbar"),
    TC_PENASCOS("TC de Peñascos"),
    TC_ORBITAS("TC de Órbitas"),
    ANGIO_TC_AORTA_TORACICA("Angio TC de Aorta Torácica"),
    ANGIO_TC_AORTA_ABDOMINAL("Angio TC de Aorta Abdominal"),

    // Resonancias Magnéticas
    RM_CADERAS("RM de Caderas"),
    RM_HOMBRO("RM de Hombro"),
    RM_RODILLA("RM de Rodilla"),
    RM_TOBILLO("RM de Tobillo"),
    RM_MUNECA("RM de Muñeca"),
    RM_CODO("RM de Codo"),
    RM_COLUMNA_CERVICAL("RM de Columna Cervical"),
    RM_COLUMNA_DORSAL("RM de Columna Dorsal"),
    RM_COLUMNA_LUMBAR("RM de Columna Lumbar"),
    RM_PIE("RM de Pie"),
    RM_TENDON_AQUILES("RM de Tendón de Aquiles"),
    RM_CEREBRO("RM de Cerebro"),

    // Otros
    ECOGRAFIA_ABDOMINAL("Ecografía Abdominal"),
    RADIOGRAFIA_TORAX("Radiografía de Tórax"),
    MAMOGRAFIA_BILATERAL("Mamografía Bilateral");

    private final String label;

    TipoEstudio(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TipoEstudio fromLabel(String label) {
        for (TipoEstudio tipo : values()) {
            if (tipo.getLabel().equalsIgnoreCase(label)) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Tipo de estudio no reconocido: " + label);
    }
}