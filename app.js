let registros = {}; // Formato: { "11": { movilidad: "SI", margen: "1,2,3" ... } }

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

const btnDictar = document.getElementById('btnDictar');
const status = document.getElementById('status');

btnDictar.onclick = () => {
    recognition.start();
    status.innerText = "Escuchando... Di 'Pieza [número]'";
    btnDictar.classList.replace('bg-red-600', 'bg-green-500');
};

recognition.onresult = (event) => {
    const texto = event.results[event.results.length - 1][0].transcript.toLowerCase();
    status.innerText = `Escuché: "${texto}"`;
    procesarComando(texto);
};

let piezaActual = null;

function procesarComando(msg) {
    // Identificar Pieza
    if (msg.includes('pieza')) {
        const match = msg.match(/\d+/);
        if (match) {
            piezaActual = match[0];
            if (!registros[piezaActual]) registros[piezaActual] = {};
            status.innerText = `Editando Pieza ${piezaActual}`;
        }
    }

    if (!piezaActual) return;

    // Lógica de parámetros
    if (msg.includes('movilidad')) registros[piezaActual].movilidad = msg.includes('sí') || msg.includes('si') ? 'SI' : '0';
    if (msg.includes('implante')) registros[piezaActual].implante = msg.includes('sí') || msg.includes('si') ? 'SI' : 'NO';
    
    // Captura de tríos numéricos (Margen, Profundidad, Nivel)
    const numeros = msg.match(/\d+/g);
    if (numeros && numeros.length >= 3) {
        const trio = `${numeros[0]},${numeros[1]},${numeros[2]}`;
        if (msg.includes('margen')) registros[piezaActual].margen = trio;
        if (msg.includes('profundidad')) registros[piezaActual].profundidad = trio;
        if (msg.includes('nivel')) registros[piezaActual].nivel = trio;
    }

    renderizarTabla();
}

function renderizarTabla() {
    const tbody = document.getElementById('cuerpoTabla');
    tbody.innerHTML = '';
    Object.keys(registros).sort().forEach(p => {
        const r = registros[p];
        tbody.innerHTML += `
            <tr>
                <td class="border p-1 font-bold">${p}</td>
                <td class="border p-1">${r.movilidad || '-'}</td>
                <td class="border p-1">${r.implante || '-'}</td>
                <td class="border p-1">${r.margen || '-'}</td>
                <td class="border p-1">${r.profundidad || '-'}</td>
            </tr>`;
    });
}

function exportarCSV() {
    let csv = "DNI,Apellido,Nombre,Pieza,Movilidad,Implante,Margen,Profundidad\n";
    const dni = document.getElementById('dni').value;
    const ape = document.getElementById('apellido').value;
    const nom = document.getElementById('nombre').value;

    Object.keys(registros).forEach(p => {
        const r = registros[p];
        csv += `${dni},${ape},${nom},${p},${r.movilidad || ''},${r.implante || ''},${r.margen || ''},${r.profundidad || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `periodontograma_${dni}.csv`);
    a.click();
}

async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("PERIODONTOGRAMA", 10, 10);
    doc.text(`Paciente: ${document.getElementById('apellido').value}, ${document.getElementById('nombre').value}`, 10, 20);
    doc.text(`DNI: ${document.getElementById('dni').value}`, 10, 30);
    
    let y = 40;
    Object.keys(registros).forEach(p => {
        const r = registros[p];
        doc.text(`Pieza ${p}: Mov:${r.movilidad} | Margen:${r.margen} | Prof:${r.profundidad}`, 10, y);
        y += 10;
    });
    doc.save('ficha.pdf');
}