import React from 'react';

import { Bar, Line } from 'react-chartjs-2';

type MonthChartProps = {
  data: any;
  ratingData: any;
};

export const MonthChart: React.FC<MonthChartProps> = props => {
  const { data, ratingData } = props;

  let x = 0;
  const len = ratingData.length;
  while (x < len) {
    ratingData[x] = parseFloat(ratingData[x]).toFixed(2);
    x++;
  }

  const barData = {
    labels: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    datasets: [
      {
        backgroundColor: '#343a40',
        borderColor: '#01070D',
        borderWidth: 2,
        data: data,
      },
    ],
  };

  const ratingBarData = {
    labels: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    datasets: [
      {
        borderColor: '#01070D',
        borderWidth: 2,
        data: ratingData,
      },
    ],
  };

  return (
    <>
      <div className="col-md-6 col-xs-12 mb-4">
        <Bar
          data={barData}
          legend={{ display: false }}
          options={{
            scales: {
              yAxes: [
                {
                  ticks: { beginAtZero: true, maxTicksLimit: 5 },
                  gridLines: {
                    display: true,
                    drawBorder: true,
                  },
                },
              ],
              xAxes: [
                {
                  gridLines: {
                    display: false,
                    drawBorder: false,
                  },
                },
              ],
            },
            title: { display: true, text: 'Count by Month' },
          }}
        />
      </div>
      <div className="col-md-6 col-xs-12 mb-4">
        <Line
          data={ratingBarData}
          legend={{ display: false }}
          options={{
            scales: {
              yAxes: [
                {
                  ticks: { beginAtZero: true, maxTicksLimit: 10, max: 5 },
                  gridLines: {
                    display: true,
                    drawBorder: true,
                  },
                },
              ],
              xAxes: [
                {
                  gridLines: {
                    display: false,
                    drawBorder: false,
                  },
                },
              ],
            },
            title: { display: true, text: 'Average rating by month' },
          }}
        />
      </div>
    </>
  );
};