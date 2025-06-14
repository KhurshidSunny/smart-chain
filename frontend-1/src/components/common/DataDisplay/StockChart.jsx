import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function StockChart({ data }) {
    const chartData = {
        labels: data.map((product) => product.name),
        datasets: [
            {
                label: 'Stock Level',
                data: data.map((product) => product.stockLevel),
                backgroundColor: 'rgba(30, 64, 175, 0.6)',
                borderColor: 'rgba(30, 64, 175, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Stock Levels by Product' },
        },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Stock Level' } },
            x: { title: { display: true, text: 'Product' } },
        },
    };

    return <Bar data={chartData} options={options} />;
}

export default StockChart;