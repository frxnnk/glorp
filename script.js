let chart;
let cachedData = []; // Variable para almacenar los datos en caché
const glorpImage = new Image();
glorpImage.src = './glorp.png'; // Asegúrate de que la imagen esté en el directorio raíz

glorpImage.onload = function() {
  console.log('Imagen cargada correctamente');
  fetchHistoricalData();
};

async function fetchHistoricalData() {
  const days = 7; // Historial de 7 días
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/glorp/ohlc?vs_currency=usd&days=${days}`);
    const data = await response.json();

    if (data && data.length > 0) {
      cachedData = data.map(entry => ({
        x: new Date(entry[0]),
        o: entry[1],
        h: entry[2],
        l: entry[3],
        c: entry[4]
      }));
      updateChart(); // Cargar el gráfico con los datos históricos
    } else {
      console.error('Datos históricos no disponibles:', data);
    }
  } catch (error) {
    console.error('Error al obtener datos históricos:', error);
  }
}

async function fetchRealTimeData() {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/glorp/ohlc?vs_currency=usd&days=1`);
    const data = await response.json();

    if (data && data.length > 0) {
      const latestData = data[data.length - 1];
      const newData = {
        x: new Date(latestData[0]),
        o: latestData[1],
        h: latestData[2],
        l: latestData[3],
        c: latestData[4]
      };

      cachedData.push(newData);
      cachedData = cachedData.filter(d => d.x >= new Date().setDate(new Date().getDate() - 1));

      updateChart();
    } else {
      console.error('Datos en tiempo real no disponibles:', data);
    }
  } catch (error) {
    console.error('Error al obtener datos en tiempo real:', error);
  }
}

function updateChart() {
  if (chart) {
    chart.data.datasets[0].data = cachedData;
    chart.update();
  } else {
    const ctx = document.getElementById('glorpChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [{
          label: 'Precio de Glorp (USD)',
          data: cachedData,
          borderColor: '#000000', // Color del borde de las velas
          backgroundColor: function(context) {
            const candle = context.raw;
            if (!candle) return '#000'; // Maneja datos undefined
            return candle.c > candle.o ? '#84a84b' : '#f44336'; // Verde para alcistas, rojo para bajistas
          },
          barThickness: 'flex', // Ajusta el grosor de las velas de forma flexible
          maxBarThickness: 20,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'MMM d, HH:mm'
              },
              tooltipFormat: 'MMM d, HH:mm',
            },
            grid: {
              color: '#3a3a3c'
            },
            ticks: {
              color: '#999',
              autoSkip: true,
              maxTicksLimit: 10,
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              color: '#3a3a3c'
            },
            ticks: {
              color: '#999'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#333',
            titleColor: '#fff',
            bodyColor: '#fff'
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'x',
              limits: {
                x: {
                  min: cachedData[0] ? cachedData[0].x : undefined,
                  max: cachedData[cachedData.length - 1] ? cachedData[cachedData.length - 1].x : undefined,
                }
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'nearest'
        }
      },
      plugins: [glorpPlugin]
    });
  }

  const now = new Date();
  const lastUpdated = document.getElementById('lastUpdated');
  lastUpdated.textContent = `Última actualización: ${now.toLocaleTimeString()}`;
}

// Plugin personalizado para dibujar la imagen en las velas verdes
const glorpPlugin = {
  id: 'glorpPlugin',
  afterRender: function(chart) {
    const ctx = chart.ctx;
    const isMobile = window.innerWidth <= 768; // Considera mobile si el ancho es 768px o menos
    const imageHeight = isMobile ? 32 : 64; // Cambia el tamaño de la imagen en mobile
    const imageWidth = isMobile ? 16 : 32;

    chart.data.datasets[0].data.forEach((candle, index) => {
      if (candle.c > candle.o) { // Verifica si la vela es verde
        const x = chart.scales.x.getPixelForValue(candle.x);
        const y = chart.scales.y.getPixelForValue(candle.c); // Coloca la imagen en el precio de cierre

        // Calcula el ancho de la vela basada en el siguiente punto de datos
        const nextCandle = chart.data.datasets[0].data[index + 1];
        let barWidth;
        if (nextCandle) {
          barWidth = chart.scales.x.getPixelForValue(nextCandle.x) - x;
        } else {
          barWidth = imageWidth; // Ancho predeterminado si no hay una siguiente vela
        }

        // Dibuja la imagen en el canvas
        ctx.save(); // Guarda el contexto actual
        ctx.drawImage(glorpImage, x - barWidth / 2, y - imageHeight, barWidth, imageHeight); // Dibuja la imagen ajustando el ancho de la vela
        ctx.restore(); // Restaura el contexto a como estaba antes de dibujar la imagen
      }
    });
  }
};


fetchHistoricalData();

