function login(){
 fetch('http://localhost:3000/login',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({
    email:email.value,
    senha:senha.value
  })
 }).then(r=>r.json())
 .then(d=>{
  localStorage.token=d.token;
  location='dashboard.html';
 });
}
