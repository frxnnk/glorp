const ctx = document.getElementById('glorpChart').getContext('2d');

const glorpImage = new Image();
glorpImage.src = './glorp.png'; // Asegúrate de que la imagen esté en el directorio raíz

let chart;

glorpImage.onload = function () {
  fetchHistoricalData();
};

async function fetchHistoricalData() {
  const days = 7; // Historial de 7 días
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/glorp/ohlc?vs_currency=usd&days=${days}`);
    const data = await response.json();

    if (data && data.length > 0) {
      const cachedData = data.map(entry => ({
        x: new Date(entry[0]),
        o: entry[1],
        h: entry[2],
        l: entry[3],
        c: entry[4]
      }));
      updateChart(cachedData);
    } else {
      console.error('Datos históricos no disponibles:', data);
    }
  } catch (error) {
    console.error('Error al obtener datos históricos:', error);
  }
}

function updateChart(cachedData) {
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'candlestick',
    data: {
      datasets: [{
        label: 'Precio de Glorp (USD)',
        data: cachedData,
        borderColor: '#000000',
        backgroundColor: function(context) {
          const candle = context.raw;
          if (!candle) return '#000';
          return candle.c > candle.o ? '#84a84b' : '#f44336';
        },
        barThickness: 'flex',
        maxBarThickness: 20,
        minBarLength: 10,
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
            maxTicksLimit: 20,
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
          wheel: {
            enabled: false,
          },
          pinch: {
            enabled: true,
          },
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    },
    plugins: [{
      id: 'glorpPlugin',
      afterRender: function (chart) {
        const ctx = chart.ctx;
        chart.data.datasets[0].data.forEach((candle, index) => {
          if (candle.c > candle.o) {
            const x = chart.scales.x.getPixelForValue(candle.x);
            const y = chart.scales.y.getPixelForValue(candle.c);

            const nextCandle = chart.data.datasets[0].data[index + 1];
            let barWidth;
            if (nextCandle) {
              barWidth = chart.scales.x.getPixelForValue(nextCandle.x) - x;
            } else {
              barWidth = 10;
            }

            // Ajuste de la imagen a la vela en dispositivos móviles
            const imageSize = window.innerWidth <= 768 ? 32 : 64;
            ctx.save();
            ctx.drawImage(glorpImage, x - barWidth / 2, y - imageSize, barWidth, imageSize);
            ctx.restore();
          }
        });
      }
    }]
  });
}

fetchHistoricalData();
setInterval(() => fetchHistoricalData(), 60000);
