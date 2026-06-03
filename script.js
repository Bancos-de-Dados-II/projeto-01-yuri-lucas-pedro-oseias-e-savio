// =====================================
// MAPA
// =====================================

const map = L.map('map').setView(
    [-7.12, -36.72],
    8
);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap'
    }
).addTo(map);

L.Control.geocoder({
    defaultMarkGeocode: true
}).addTo(map);

// =====================================
// VARIÁVEIS
// =====================================

let municipiosGeo = [];
let geojsonLayer;
let chart;
let dadosIBGE = {};
let dadosComunidades = {};

// =====================================
// CORES
// =====================================

function getColor(comunidades){

    if(comunidades > 40)
        return "#14532d";

    if(comunidades > 25)
        return "#15803d";

    if(comunidades > 15)
        return "#22c55e";

    if(comunidades > 10)
        return "#84cc16";

    if(comunidades > 5)
        return "#facc15";

    return "#f97316";

}

// =====================================
// CARREGAR GEOJSON
// =====================================

async function carregarDadosIBGE(){

    const response =
    await fetch(
        "c99a759c17b06bcac311736d48b4fb25.json"
    );

    const json =
    await response.json();

    json.features.forEach(item=>{

        const texto =
        item.properties["Paraíba "] ||
        item.properties["Para&iacute;ba "];

        if(!texto) return;

        if(texto.includes("Município")) return;

        const partes =
        texto.split(",");

        if(partes.length < 14) return;

        const codigo =
        partes[1].trim();

        dadosIBGE[codigo] = {

            municipio:
            partes[0].trim(),

            populacao:
            Number(
                partes[5]
                .replace(/\./g,'')
                .replace(',','.')
            ),

            densidade:
            Number(
                partes[6]
                .replace(',','.')
            ),

            populacaoEstimada:
            Number(
                partes[7]
                .replace(/\./g,'')
                .replace(',','.')
            ),

            idhm:
            partes[9],

            pibPerCapita:
            Number(
                partes[13]
                .replace(/\./g,'')
                .replace(',','.')
            )

        };

    });

}

async function carregarComunidades(){

            const response =
            await fetch(
                "comunidades_pb.json"
            );

            const json =
            await response.json();

            json.forEach(item=>{

                dadosComunidades[
                    item.codigo_ibge
                ] = item;

            });

        }

// =====================================

async function carregarDados(){

    try{

        await carregarDadosIBGE();

        await carregarComunidades();

        const response =
        await fetch(
            "PB_Municipios_2025.json"
        );

        const geojson =
        await response.json();

        municipiosGeo =
        geojson.features;

        desenharMapa();

        gerarListaMunicipios();

        gerarEstatisticas();

    }
    catch(erro){

        console.error(
            "Erro ao carregar dados",
            erro
        );

    }

}

// =====================================
// ESTILO DOS MUNICÍPIOS
// =====================================

function estiloMunicipio(feature){

    const codigo =
    feature.properties.CD_MUN;

    const comunidade =
    dadosComunidades[codigo];

    const quantidade =
    comunidade
    ? comunidade.comunidades
    : 0;

    return {

        color:"#222",

        weight:1,

        fillColor:
        getColor(
            quantidade
        ),

        fillOpacity:0.7

    };

}

// =====================================
// POPUPS E EVENTOS
// =====================================

function aoClicarMunicipio(
    feature,
    layer
){

    const nome =
    feature.properties.NM_MUN;

    const codigo =
    feature.properties.CD_MUN;

    const area =
    feature.properties.AREA_KM2;

    const comunidade =
    dadosComunidades[codigo];

    layer.bindPopup(`

        <strong>${nome}</strong>

        <br>

        Código:
        ${codigo}

        <br>

        Comunidades:
        ${comunidade
            ? comunidade.comunidades
            : 0
        }

    `);

    layer.on({

        click: ()=>{

            mostrarInfo(
                nome,
                codigo,
                area
            );

        }

    });

}

// =====================================
// DESENHAR MUNICÍPIOS
// =====================================

function desenharMapa(){

    geojsonLayer =
    L.geoJSON(
        municipiosGeo,
        {

            style:
            estiloMunicipio,

            onEachFeature:
            aoClicarMunicipio

        }
    ).addTo(map);

}

// =====================================
// LISTA LATERAL
// =====================================

function gerarListaMunicipios(){

    const lista =
    document.getElementById(
        "listaMunicipios"
    );

    lista.innerHTML = "";

    municipiosGeo.forEach(
        municipio=>{

            const item =
            document.createElement(
                "div"
            );

            item.className =
            "municipio-item";

            item.innerHTML = `

                <div class="municipio-nome">
                ${municipio.properties.NM_MUN}
                </div>

                <div class="municipio-codigo">
                ${municipio.properties.CD_MUN}
                </div>

            `;

            item.addEventListener(
                "click",
                ()=>{

                    const bounds =
                    L.geoJSON(
                        municipio
                    ).getBounds();

                    map.fitBounds(
                        bounds
                    );

                    mostrarInfo(
                        municipio.properties.NM_MUN,
                        municipio.properties.CD_MUN,
                        municipio.properties.AREA_KM2
                    );

                }
            );

            lista.appendChild(
                item
            );

        }
    );

}

// =====================================
// BUSCA
// =====================================

document
.getElementById("busca")
.addEventListener(
"input",
function(){

    const texto =
    this.value.toLowerCase();

    document
    .querySelectorAll(
        ".municipio-item"
    )
    .forEach(item=>{

        item.style.display =
        item.textContent
        .toLowerCase()
        .includes(texto)
        ? "block"
        : "none";

    });

}
);

// =====================================
// FILTRO DE ÁREA
// =====================================

document
.getElementById(
    "filtroComunidades"
)
.addEventListener(
"change",
function(){

    const limite =
    Number(this.value);

    geojsonLayer.eachLayer(
        layer=>{

            const codigo =
            layer.feature
            .properties
            .CD_MUN;

            const comunidade =
            dadosComunidades[codigo];

            const quantidade =
            comunidade
            ? comunidade.comunidades
            : 0;

            if(quantidade >= limite){

                layer.addTo(map);

            }else{

                map.removeLayer(layer);

            }

        }
    );

}
);

// =====================================
// PAINEL DIREITO
// =====================================

function mostrarInfo(
    nome,
    codigo,
    area
){

    const painel =
    document.getElementById(
        "dadosMunicipio"
    );

    const ibge =
    dadosIBGE[codigo];

    const comunidade =
    dadosComunidades[codigo];

    if(!ibge){

        painel.innerHTML = `
            <h3>${nome}</h3>
            <p>Sem dados disponíveis.</p>
        `;

        return;

    }

    painel.innerHTML = `

        <h3>${nome}</h3>

        <div class="info-item">
            <span class="info-label">
            Código IBGE:
            </span>
            ${codigo}
        </div>

        <div class="info-item">
            <span class="info-label">
            Área:
            </span>
            ${Number(area).toFixed(2)}
            km²
        </div>

        <div class="info-item">
            <span class="info-label">
            População:
            </span>
            ${ibge.populacao.toLocaleString(
                'pt-BR'
            )}
        </div>

        <div class="info-item">
            <span class="info-label">
            IDHM:
            </span>
            ${ibge.idhm}
        </div>

        <hr>

        <div class="info-item">
            <span class="info-label">
            Comunidades:
            </span>
            ${comunidade
                ? comunidade.comunidades
                : 0}
        </div>

        <div class="info-item">
            <span class="info-label">
            Iniciativas:
            </span>
            ${comunidade
                ? comunidade.iniciativas
                : 0}
        </div>

        <div class="info-item">
            <span class="info-label">
            Equipamentos Sociais:
            </span>
            ${comunidade
                ? comunidade.equipamentosSociais
                : 0}
        </div>

        <div class="info-item">
            <span class="info-label">
            Vulnerabilidades:
            </span>
            ${comunidade
                ? comunidade.vulnerabilidades
                : 0}
        </div>

        <div class="info-item">
            <span class="info-label">
            Potencialidades:
            </span>
            ${comunidade
                ? comunidade.potencialidades
                : 0}
        </div>

    `;

    if(comunidade){

        atualizarGrafico(
            comunidade.comunidades,
            comunidade.iniciativas,
            comunidade.equipamentosSociais,
            comunidade.vulnerabilidades,
            comunidade.potencialidades
        );

    }

}

// =====================================
// GRÁFICO
// =====================================

function atualizarGrafico(
    comunidades,
    iniciativas,
    equipamentos,
    vulnerabilidades,
    potencialidades
){

    const ctx =
    document.getElementById(
        "graficoMunicipio"
    );

    if(chart){

        chart.destroy();

    }

    chart =
    new Chart(
        ctx,
        {

            type:"bar",

            data:{

                labels:[

                    "Comunidades",
                    "Iniciativas",
                    "Equipamentos",
                    "Vulnerabilidades",
                    "Potencialidades"

                ],

                datasets:[{

                    label:
                    "Indicadores Comunitários",

                    data:[

                        comunidades,
                        iniciativas,
                        equipamentos,
                        vulnerabilidades,
                        potencialidades

                    ]

                }]

            },

            options:{

                responsive:true

            }

        }
    );

}

// =====================================
// ESTATÍSTICAS
// =====================================

function gerarEstatisticas(){

    const totalMunicipios =
    municipiosGeo.length;

    let totalComunidades = 0;

    let totalIniciativas = 0;

    Object.values(
        dadosComunidades
    ).forEach(item=>{

        totalComunidades +=
        item.comunidades;

        totalIniciativas +=
        item.iniciativas;

    });

    document
    .getElementById(
        "estatisticas"
    )
    .innerHTML = `

        <p>

            Municípios:

            <strong>

            ${totalMunicipios}

            </strong>

        </p>

        <p>

            Comunidades:

            <strong>

            ${totalComunidades}

            </strong>

        </p>

        <p>

            Iniciativas:

            <strong>

            ${totalIniciativas}

            </strong>

        </p>

    `;

}

// =====================================
// GEOLOCALIZAÇÃO
// =====================================

document
.getElementById(
"btnLocalizacao"
)
.addEventListener(
"click",
()=>{

    navigator
    .geolocation
    .getCurrentPosition(
        pos=>{

            map.flyTo(
                [
                    pos.coords.latitude,
                    pos.coords.longitude
                ],
                12
            );

            L.marker(
                [
                    pos.coords.latitude,
                    pos.coords.longitude
                ]
            )
            .addTo(map)
            .bindPopup(
                "Sua localização"
            )
            .openPopup();

        }
    );

}
);

// =====================================
// INICIAR
// =====================================


carregarDados();