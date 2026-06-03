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

// =====================================
// CORES
// =====================================

function getColor(area){

    if(area > 1000) return "#14532d";
    if(area > 500) return "#16a34a";
    if(area > 250) return "#84cc16";
    if(area > 100) return "#facc15";

    return "#f97316";
}

// =====================================
// CARREGAR GEOJSON
// =====================================

async function carregarDados(){

    try{

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
            "Erro ao carregar GeoJSON",
            erro
        );

    }

}

// =====================================
// ESTILO DOS MUNICÍPIOS
// =====================================

function estiloMunicipio(feature){

    return {

        color:"#222",

        weight:1,

        fillColor:
        getColor(
            feature.properties.AREA_KM2
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

    layer.bindPopup(`

        <strong>${nome}</strong>

        <br>

        Código:
        ${codigo}

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
    "filtroPopulacao"
)
.addEventListener(
"change",
function(){

    const limite =
    Number(this.value);

    geojsonLayer.eachLayer(
        layer=>{

            const area =
            layer.feature
            .properties
            .AREA_KM2;

            if(area >= limite){

                layer.addTo(map);

            }else{

                map.removeLayer(
                    layer
                );

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
            Área Territorial:
            </span>

            ${Number(area)
            .toFixed(2)}
            km²

        </div>

    `;

    atualizarGrafico(
        area
    );

}

// =====================================
// GRÁFICO
// =====================================

function atualizarGrafico(
    area
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
                    "Área Territorial"
                ],

                datasets:[

                    {

                        label:
                        "km²",

                        data:[
                            area
                        ]

                    }

                ]

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

    const areaTotal =
    municipiosGeo.reduce(
        (
            soma,
            m
        )=>
        soma +
        m.properties.AREA_KM2,
        0
    );

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

        Área Total:

        <strong>

        ${areaTotal.toFixed(0)}
        km²

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