import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Swal from 'sweetalert2'
import '../components/App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function CryptoChart({ cryptoId }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Chart
    const fetchChartData = async () => {
      if (!cryptoId) return;

      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=1`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const allPrices = data.prices;

        const now = Date.now();
        const fourHoursAgo = now - (4 * 60 * 60 * 100);

        const filteredPrices = allPrices.filter(price => price[0] >= fourHoursAgo);

        const prices = filteredPrices.map(price => ({
          x: new Date(price[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          y: price[1]
        }));


        setChartData({
          labels: prices.map(price => price.x),
          datasets: [
            {
              label: cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1),
              data: prices.map(price => price.y),
              borderColor: 'rgb(75, 192, 128)',
              tension: 0.1
            }
          ]
        });
      } catch (e) {
        console.error('Error fetching chart data:', e);
      }
    };

    fetchChartData();
  }, [cryptoId]);

  if (!chartData) return <h2><p>Loading chart...</p></h2>;

  return (
    <div className="crypto-chart">
      <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  );
}

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [searchedCrypto, setSearchedCrypto] = useState(null);

  useEffect(() => {
    const fetchTopCryptos = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setCryptoData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCryptos();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const fetchCryptoData = async (cryptoName) => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${cryptoName}`);
      if (!response.ok) throw new Error(searchTerm);

       const data = await response.json();
      // if (data.coins.length === 0) {
      //   throw new Error('Cryptocurrency not found');
      // }

      const cryptoId = data.coins[0].id;
      const detailResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
      if (!detailResponse.ok) throw new Error(`HTTP error! status: ${detailResponse.status}`);

      const detailData = await detailResponse.json();
      setSearchedCrypto(detailData);
      setSelectedCrypto(cryptoId);
    } catch (e) {
      setError(e.message);
      setSearchedCrypto(null);
      setSelectedCrypto(null);
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchTerm) {
      Swal.fire({
        title: "Wrong!",
        text: "Please enter a cryptocurrency's name",
        icon: "error"
      });
    }

    setLoading(true);
    setError(null);

    await fetchCryptoData(searchTerm);
    setLoading(false);
  };

 

  return (
    <div className="App">
      <header>Cryptocurrency Dashboard </header>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Enter Cryptocurrency's name or symbol..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button className="search-button" onClick={handleSearchSubmit}>
          Search
        </button>
      </div>

      {loading && <h2><p className="loading-message">Loading...</p></h2>}
      {error && <h2><p className="error">{searchTerm}</p></h2>}

      {searchedCrypto ? (
        <div className="searched-crypto">
          <h2>{searchedCrypto.name} {searchedCrypto.id} ({searchedCrypto.symbol.toUpperCase()})</h2>
          <div className="crypto-info">
            <div className="table-header">
              <h1>Price</h1><h1>Market Cap</h1><h1>24h Change</h1>
            </div>
            <div className="crypto-row">
              <div className="crypto-cell price">${searchedCrypto.market_data.current_price.usd.toLocaleString()}</div>
              <div className="crypto-cell market-cap">${(searchedCrypto.market_data.market_cap.usd / 1e9).toFixed(2)}B</div>
              <div className={`crypto-cell change ${searchedCrypto.market_data.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                {searchedCrypto.market_data.price_change_percentage_24h.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>

          <div className="table-header">
            <h1>Name</h1><h1>Price</h1><h1>Market Cap</h1><h1>24h Change</h1>
          </div>

          {cryptoData.map((item, i) => (
            <div key={i} className="crypto-info" onClick={() => setSelectedCrypto(item.id)}>
              <div className="crypto-row">
                <div className="crypto-cell name">{item.name} ({item.symbol.toUpperCase()})</div>
                <div className="crypto-cell price">${item.current_price.toLocaleString()}</div>
                <div className="crypto-cell market-cap">${(item.market_cap / 1e9).toFixed(2)}B</div>
                <div className={`crypto-cell change ${item.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                  {item.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </>
      )}
      {selectedCrypto && <CryptoChart cryptoId={selectedCrypto} />}
    </div>
  );
}
export default App;
