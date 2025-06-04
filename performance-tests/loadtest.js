import http from 'k6/http';
import { check } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export let options = {
  scenarios: {
    authentication_flow: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: 5, duration: '60s' },
        { target: 10, duration: '120s' },
        { target: 20, duration: '180s' },
        { target: 5, duration: '60s' },
      ],
      exec: 'authFlow'
    },
    tasks: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 50,
      stages: [
        { target: 10, duration: '30s' },
      ],
      exec: 'taskFlow'
    },
    admin_operations: {
      executor: 'ramping-arrival-rate',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 20,
      stages: [
        { target: 5, duration: '30s' },
      ],
      exec: 'adminFlow'
    }
  }
};

export function authFlow() {
  const username = `user${randomIntBetween(1, 1000000)}`;
  const password = 'TestPass123!';

const registerRes = http.post('https://dipl-production-fa98.up.railway.app/api/register', JSON.stringify({
  // const registerRes = http.post('http://localhost:5000/api/register', JSON.stringify({
    fullName: 'Test User',
    username,
    password,
    confirmPassword: password
  }), { headers: { 'Content-Type': 'application/json' } });

  check(registerRes, { 'register status 201': (r) => r.status === 201 });

  if (registerRes.status !== 201) return;

const loginRes = http.post('https://dipl-production-fa98.up.railway.app/api/login', JSON.stringify({
  // const loginRes = http.post('http://localhost:5000/api/login', JSON.stringify({
    username,
    password
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, { 'login status 200': (r) => r.status === 200 });

  http.post('https://dipl-production-fa98.up.railway.app/api/logout');
//  http.post('http://localhost:5000/api/logout');

  const adminLogin = http.post('https://dipl-production-fa98.up.railway.app/api/login', JSON.stringify({
// const adminLogin = http.post('http://localhost:5000/api/login', JSON.stringify({
    username: 'admin',
    password: 'admin123'
  }), { headers: { 'Content-Type': 'application/json' } });

  check(adminLogin, { 'admin login 200': (r) => r.status === 200 });

  const userId = JSON.parse(registerRes.body).id;
  if (userId) {
    
     http.del(`https://dipl-production-fa98.up.railway.app/api/admin/users/${userId}`);
    // http.del(`http://localhost:5000/api/admin/users/${userId}`);
  }
 http.post('https://dipl-production-fa98.up.railway.app/api/logout');
  // http.post('http://localhost:5000/api/logout');
  
}

export function taskFlow() {

const login = http.post('https://dipl-production-fa98.up.railway.app/api/login', JSON.stringify({
  // const login = http.post('http://localhost:5000/api/login', JSON.stringify({
    username: 'admin',
    password: 'admin123'
  }), { headers: { 'Content-Type': 'application/json' } });

  check(login, { 'admin login 200': (r) => r.status === 200 });

  // http.get('http://localhost:5000/api/tasks');
  // http.post('http://localhost:5000/api/logout');
  http.get('https://dipl-production-fa98.up.railway.app/api/tasks');
  http.post('https://dipl-production-fa98.up.railway.app/api/logout');
  
}

export function adminFlow() {
 
  const login = http.post('https://dipl-production-fa98.up.railway.app/api/login', JSON.stringify({
  // const login = http.post('http://localhost:5000/api/login', JSON.stringify({
    username: 'admin',
    password: 'admin123'
  }), { headers: { 'Content-Type': 'application/json' } });

  check(login, { 'admin login 200': (r) => r.status === 200 });

  // http.get('http://localhost:5000/api/admin/users');
  http.get('https://dipl-production-fa98.up.railway.app/api/admin/users');
  const newUsername = `user${randomIntBetween(1, 10000)}`;
   
  // const createUser = http.post('http://localhost:5000/api/createUser', JSON.stringify({
  const createUser = http.post('https://dipl-production-fa98.up.railway.app/api/createUser', JSON.stringify({
    fullName: 'Test User',
    username: newUsername,
    password: 'TestPass123!'
  }), { headers: { 'Content-Type': 'application/json' } });

  const userId = createUser.status === 201 ? JSON.parse(createUser.body).id : null;
  if (userId) {
    
    http.del(`https://dipl-production-fa98.up.railway.app/api/admin/users/${userId}`);
    // http.del(`http://localhost:5000/api/admin/users/${userId}`);
  } 

  // http.post('http://localhost:5000/api/logout');
  http.post('https://dipl-production-fa98.up.railway.app/api/logout');
 
}
