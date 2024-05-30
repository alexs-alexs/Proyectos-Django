import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const promptKey = "prompt";
const apiKey = "Tucodigo_Gemini";
const modelID = "gemini-pro";
const maxPreguntas = 5;

let todasLasPreguntas = [];

function obtenerPromptInicial() {
    return {
        "number 0": {
            "question": "I have __ cat.",
            "options": {
                "1": "on",
                "2": "a",
                "3": "the"
            },
            "correctAnswer": 2,
            "answer": "True"
        }
    };
}

function guardarPromptEnSessionStorage(prompt) {
    const promptJSON = JSON.stringify(prompt);
    sessionStorage.setItem(promptKey, promptJSON);
}

function obtenerPromptDeSessionStorage() {
    const promptJSON = sessionStorage.getItem(promptKey);
    return promptJSON ? JSON.parse(promptJSON) : null;
}

function generarMensajePrompt(prompt) {
    console.log(todasLasPreguntas);
    const preguntas = [...todasLasPreguntas, prompt];
    return `Eres un tutor evaluador de inglés del nivel A0 - C2. Estas realizando preguntas en el siguiente formato JSON:
    ${JSON.stringify(preguntas, null, 2)}. Toma este formato y entregame la siguiente pregunta con una sola respuesta. En "respuesta": "" dejalo vacio. Verifica si la ultima respuesta fue "True", aumenta la dificultad; si fue "False", reduce la dificultad. Varía las preguntas con gramática y vocabulario. Responde en JSON sin agregar textos o acentos graves, por favor.`;
}

function generarMensajeEvaluacion() {
    return `Actúa como un tutor de inglés. Tu estudiante respondió la siguiente encuesta: ${JSON.stringify(todasLasPreguntas)}. Evalúa según tus criterios en qué nivel de inglés está el estudiante entre A0 - C2 y qué temas debería estudiar. Entrégalo en este formato tipo JSON pero como cadena:
    """{"Nivel":"puedes poner el nivel de respuesta de A0-C2",
    "Razonamiento":"puedes describir el razonamiento del estudiante según el cuestionario",
    "temas_a_estudiar":"Describe los temas que necesita estudiar"}"""
    `;
}

async function configurarModeloAI(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    return await genAI.getGenerativeModel({ model: modelID });
}

async function manejarConsulta(model) {
    const ultimaPreguntaDiv = document.querySelector("#ultimaPregunta");
    const jsonResponse = obtenerPromptDeSessionStorage();

    if (!jsonResponse) {
        alert("No se pudo obtener el prompt de sessionStorage.");
        activarBoton();
        return;
    }

    const lastKey = Object.keys(jsonResponse).pop();
    const lastQuestion = jsonResponse[lastKey];

    if (!respuestaSeleccionada()) {
        alert("Por favor, selecciona una opción antes de continuar.");
        activarBoton();
        return;
    } else {
        manejarEnvioRespuesta(jsonResponse, lastKey, lastQuestion);
    }

    todasLasPreguntas.push(jsonResponse);
    const numeroPreguntas = todasLasPreguntas.length;

    if (numeroPreguntas >= maxPreguntas) {
        const consultaFinal = generarMensajeEvaluacion();
        try {
            const result = await model.generateContent(consultaFinal);
            const response = await result.response;
            const evaluacion = await response.text();
            console.log(evaluacion);
            sessionStorage.setItem("evaluacion", evaluacion);
            window.location.assign(evaluacionUrl);  // Usa la URL pasada desde el template
        } catch (error) {
            console.error("Error en la consulta final:", error);
            alert("Hubo un problema al obtener la evaluación.");
        }
    } else {
        desactivarBoton();
        const consulta = generarMensajePrompt(jsonResponse);
        const resultadoConsulta = document.querySelector("#resultadoConsulta");

        try {
            const result = await model.generateContent(consulta);
            const response = await result.response;
            let text = await response.text();

            if (text.startsWith("```") && text.endsWith("```")) {
                text = text.slice(3, -3).trim();
            }

            let nuevoJsonResponse;
            try {
                nuevoJsonResponse = JSON.parse(text);
            } catch (jsonError) {
                console.error("Error al parsear JSON:", jsonError);
                resultadoConsulta.innerHTML = 'La respuesta del chatbot no es un JSON válido.';
                activarBoton();
                return;
            }

            mostrarUltimaPregunta(nuevoJsonResponse, ultimaPreguntaDiv);
            guardarPromptEnSessionStorage(nuevoJsonResponse);
        } catch (error) {
            resultadoConsulta.innerHTML = 'Problemas en la consulta';
            console.error("Error en la consulta:", error);
        }
        activarBoton();
    }
}

function respuestaSeleccionada() {
    return document.querySelector('input[name="option"]:checked') !== null;
}

function mostrarUltimaPregunta(jsonResponse, ultimaPreguntaDiv) {
    if (!jsonResponse) {
        ultimaPreguntaDiv.innerHTML = "No se pudo obtener la última pregunta.";
        return;
    }

    const lastKey = Object.keys(jsonResponse).pop();
    const lastQuestion = jsonResponse[lastKey];

    ultimaPreguntaDiv.innerHTML = `
        <h3>${lastQuestion.question}</h3>
        <form id="formOpciones">
            ${Object.keys(lastQuestion.options).map(key => `
                <div>
                    <input type="radio" id="option${key}" name="option" value="${key}">
                    <label for="option${key}">${lastQuestion.options[key]}</label>
                </div>
            `).join('')}
            <!-- <button type="button" id="submitRespuesta">Enviar</button> -->
        </form>
    `;

    document.querySelector("#submitRespuesta").addEventListener("click", () => {
        manejarEnvioRespuesta(jsonResponse, lastKey, lastQuestion);
    });
}

function manejarEnvioRespuesta(jsonResponse, lastKey, lastQuestion) {
    const selectedOption = document.querySelector('input[name="option"]:checked');
    if (selectedOption) {
        const selectedValue = parseInt(selectedOption.value);
        const isCorrect = lastQuestion.correctAnswer === selectedValue;
        lastQuestion.answer = isCorrect ? "True" : "False";

        alert(`Seleccionaste: ${lastQuestion.options[selectedOption.value]}. Respuesta ${isCorrect ? "Correcta" : "Incorrecta"}`);

        jsonResponse[lastKey] = lastQuestion;
        sessionStorage.setItem(promptKey, JSON.stringify(jsonResponse));
    } else {
        alert("Por favor, selecciona una opción.");
    }
}

function desactivarBoton() {
    const botonConsulta = document.querySelector("#botonConsulta");
    botonConsulta.disabled = true;
    botonConsulta.innerText = "Consultando...";
}

function activarBoton() {
    const botonConsulta = document.querySelector("#botonConsulta");
    botonConsulta.disabled = false;
    botonConsulta.innerText = "Siguiente";
}

async function iniciarPagina() {
    const model = await configurarModeloAI(apiKey);
    if (!sessionStorage.getItem(promptKey)) {
        const promptInicial = obtenerPromptInicial();
        guardarPromptEnSessionStorage(promptInicial);
        todasLasPreguntas.push(promptInicial);
    } else {
        const storedPrompt = obtenerPromptDeSessionStorage();
        if (storedPrompt) {
            todasLasPreguntas.push(storedPrompt);
        } else {
            const promptInicial = obtenerPromptInicial();
            guardarPromptEnSessionStorage(promptInicial);
            todasLasPreguntas.push(promptInicial);
        }
    }
    mostrarUltimaPregunta(obtenerPromptDeSessionStorage(), document.querySelector("#ultimaPregunta"));
}

document.querySelector("#botonConsulta").addEventListener("click", async () => {
    const model = await configurarModeloAI(apiKey);
    await manejarConsulta(model);
});

// Inicializar la página
iniciarPagina();
