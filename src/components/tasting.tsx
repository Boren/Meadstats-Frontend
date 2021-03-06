import React, { useState, useEffect, ReactElement } from 'react';
import axios from 'axios';
import useInterval from 'use-interval';

import { API_ROOT } from '../api/api-config';

import { Row, Col, Table } from 'reactstrap';

import './tables/table.css';
import './tasting.css';
import { Loading } from './loading';

type Tasting = {
  name: string;
  tasters: number[];
  beers: number[];
  startTime: Date;
  endTime: Date;
  hideUntasted: boolean;
  showWeightedAverage: boolean;
};

type Beer = {
  id: number;
  name: string;
  brewery: string;
  country: string;
  label: string;
  globalrating: number;
  abv: number;
  style: string;
};

type User = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  avatarHd: string;
  totalBeers: number;
  rank: string;
};

type Checkin = {
  id: number;
  beerid: number;
  userid: number;
  rating: number;
  date: Date;
};

function mapTotalToRank(total: number): string {
  if (total > 10000) return 'Gud';
  if (total > 5000) return 'Pave';
  if (total > 2500) return 'Dekan';
  if (total > 1500) return 'Kardinal';
  if (total > 1000) return 'Erkebiskop';
  if (total > 500) return 'Biskop';
  if (total > 300) return 'Prest';
  if (total > 200) return 'Diakon';
  if (total > 100) return 'Abbed';
  if (total > 65) return 'Munk';
  if (total > 25) return 'Apostel';
  return 'Misjonær';
}

export const Tasting: React.FunctionComponent<{ tastingId?: number }> = (props) => {
  const { tastingId } = props;

  const [tasting, setTasting] = useState<Tasting>({
    name: '',
    tasters: [],
    beers: [],
    startTime: new Date(),
    endTime: new Date(),
    hideUntasted: true,
    showWeightedAverage: true,
  });
  const [beers, setBeers] = useState<Beer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [updating, setUpdating] = useState<boolean>(false);
  const [missing, setMissing] = useState([]);

  // Get tasting details
  useEffect(() => {
    const start = new Date();
    start.setHours(start.getHours() - 2);

    const end = new Date();
    end.setHours(end.getHours() + 2);

    setTasting({
      name: 'Julelønsj',
      tasters: [1033418, 3624256, 1124904, 6889469, 684117],
      beers: [3562879, 3555213, 3539893, 2830731],
      startTime: start,
      endTime: end,
      hideUntasted: true,
      showWeightedAverage: true,
    });
  }, [tastingId]);

  // Get tasting members and beers
  useEffect(() => {
    if (tasting) {
      setBeers([]);
      setUsers([]);
      setCheckins([]);

      if (tasting.beers.length > 0) {
        axios
          .get(`${API_ROOT}/v1/tasting/beers?beers=` + tasting.beers.join(','))
          .then(({ data }) => {
            setBeers(
              data.data.beers.map((beer) => {
                return {
                  id: beer.id,
                  name: beer.name,
                  brewery: beer.brewery.name,
                  label: beer.label,
                  globalrating: beer.rating,
                  abv: beer.abv,
                  style: beer.style,
                  country: beer.country,
                } as Beer;
              }),
            );
          })
          .catch(() => {
            console.error('Unable to get beer list');
          });
      }

      if (tasting.tasters.length > 0) {
        axios
          .get(`${API_ROOT}/v1/tasting/users?users=` + tasting.tasters.join(','))
          .then(({ data }) => {
            setUsers(
              data.data.users.map((user) => {
                return {
                  id: user.id,
                  name: user.user_name,
                  firstName: user.first_name,
                  lastName: user.last_name,
                  avatarHd: user.avatar_hd,
                  totalBeers: user.total_beers,
                  rank: mapTotalToRank(user.total_beers),
                } as User;
              }),
            );
          })
          .catch(() => {
            console.error('Unable to get user list');
          });
      }

      if (tasting.beers.length > 0 && tasting.tasters.length > 0) {
        axios
          .get(`${API_ROOT}/v1/tasting/checkins?users=${tasting.tasters.join(',')}&beers=${tasting.beers.join(',')}`)
          .then(({ data }) => {
            setCheckins(
              data.data.checkins.map((checkin) => {
                return {
                  id: checkin.id,
                  beerid: checkin.beer.id,
                  userid: checkin.user.id,
                  rating: checkin.rating,
                  date: new Date(checkin.first_had),
                } as Checkin;
              }),
            );
          })
          .catch(() => {
            console.error('Unable to get checkin list');
          });
      }
    }
  }, [tasting]);

  useInterval(() => {
    if (tasting.beers.length > 0 && tasting.tasters.length > 0) {
      setUpdating(true);

      axios
        .get(`${API_ROOT}/v1/tasting/updateUsers?users=` + tasting.tasters.join(','), {
          headers: { Authorization: 'Bearer ' + window.localStorage.getItem('authToken') },
        })
        .then(({ data }) => {
          setMissing(data.missing);
          if (data.updated) {
            axios
              .get(
                `${API_ROOT}/v1/tasting/checkins?users=${tasting.tasters.join(',')}&beers=${tasting.beers.join(',')}`,
              )
              .then(({ data }) => {
                setCheckins(
                  data.data.checkins.map((checkin) => {
                    return {
                      id: checkin.id,
                      beerid: checkin.beer.id,
                      userid: checkin.user.id,
                      rating: checkin.rating,
                      date: new Date(checkin.first_had),
                    } as Checkin;
                  }),
                );
              })
              .catch(() => {
                console.error('Unable to get checkin list');
              });
          }
        })
        .catch(() => {
          console.error('Unable to update users');
        })
        .finally(() => {
          setUpdating(false);
        });
    }
  }, 0.5 * 60 * 1000);

  const visibleBeers = new Set(checkins.map((checkin) => checkin.beerid));
  const firstCheckin = {};

  checkins.forEach((checkin) => {
    if (checkin.beerid in firstCheckin) {
      if (firstCheckin[checkin.beerid] > checkin.date) {
        firstCheckin[checkin.beerid] = checkin.date;
      }
    } else {
      firstCheckin[checkin.beerid] = checkin.date;
    }
  });

  return (
    <Row>
      <Col xs="12">
        <div className="tasting-heading">
          <h1>
            {tasting.name}
            {updating ? <Loading /> : ''}
          </h1>
        </div>
        <Table responsive borderless hover className={'tasting-table'}>
          <thead>
            <tr>
              <th></th>
              {users
                .sort((a, b) => (a.totalBeers < b.totalBeers ? 1 : -1))
                .map((user) => (
                  <th key={user.id}>
                    <UserElement user={user} missing={missing} />
                  </th>
                ))}
              <th>Average</th>
            </tr>
          </thead>
          <tbody>
            {beers
              .filter((beer) => (tasting.hideUntasted ? visibleBeers.has(beer.id) : true))
              .sort((a, b) => (firstCheckin[a.id] < firstCheckin[b.id] ? 1 : -1))
              .map((beer) => {
                return (
                  <tr key={beer.id}>
                    <th scope="row">
                      <BeerElement beer={beer} />
                    </th>
                    {users
                      .sort((a, b) => (a.totalBeers < b.totalBeers ? 1 : -1))
                      .map((user) => {
                        const checkin = checkins.find(
                          (checkin) => checkin.beerid === beer.id && checkin.userid === user.id,
                        );
                        return (
                          <td key={beer.id + '' + user.id}>
                            <CheckinElement checkin={checkin} />
                          </td>
                        );
                      })}
                    <td className="tasting-checkin">
                      {(
                        checkins
                          .filter((checkin) => checkin.beerid === beer.id)
                          .map((checkin) => checkin.rating)
                          .reduce((a, b) => {
                            return a + b;
                          }, 0) / checkins.filter((checkin) => checkin.beerid === beer.id).length
                      ).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

function BeerElement(props): ReactElement {
  let style;

  if (props.beer.style.includes(' - ')) {
    const splitted = props.beer.style.split(' - ');
    style = (
      <div>
        <span className="table-twoline-main">
          {splitted[0]} - {splitted[1]}
        </span>
      </div>
    );
  } else {
    style = (
      <div>
        <span className="table-twoline-main">{props.beer.style}</span>
      </div>
    );
  }

  return (
    <>
      <span className="table-flex">
        <img className="beertable-image" alt="Beer Logo" src={props.beer.label} />
        <div>
          <span className="table-twoline-main">{props.beer.name}</span>
          <span className="table-twoline-sub">{props.beer.brewery}</span>
          {style}
          {props.beer.globalrating.toFixed(2)} - {props.beer.abv.toFixed(1)}%
        </div>
      </span>
    </>
  );
}

function UserElement(props): ReactElement {
  return (
    <>
      <div>
        <img className="beertable-image" alt={props.user.name} src={props.user.avatarHd} />
      </div>
      <div>{props.user.name}</div>
      {props.missing.find((user) => user === props.user.name) ? <div className="missing-token">Missing token</div> : ''}
      <div>
        {props.user.totalBeers} - {props.user.rank}
      </div>
    </>
  );
}

function CheckinElement(props): ReactElement {
  if (props.checkin == null) {
    return <span className="tasting-checkin">-</span>;
  }
  return <span className="tasting-checkin">{props.checkin.rating.toFixed(2)}</span>;
}
