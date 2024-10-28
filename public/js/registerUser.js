// Definir la URL base dependiendo del entorno (local o producción)
const baseUrl = 
  window.location.hostname === 'localhost'
    ? 'http://localhost:8090' // Local
    : 'https://fukusuke-sushi-delivery.onrender.com';

console.log(baseUrl);
const funciono = true;
document.getElementById('registerUserForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const run = document.getElementById('registerRun').value;
    const name = document.getElementById('registerName').value;
    const address = document.getElementById('registerAddress').value;
    const province = document.getElementById('registerProvince').value;
    const region = document.getElementById('registerRegion').value;
    const bornDate = document.getElementById('registerBornDate').value;
    const sex = document.getElementById('registerSex').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('registerPhone').value;

    console.log('Sending user data:', {
        run, name, address, province, region, bornDate, sex, email, password, phone
    });
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation addUser($input: UserInput) {
                        addUser(input: $input) {
                            id
                            run
                            name
                            address
                            province
                            region
                            bornDate
                            sex
                            email
                            password
                            phone
                        }
                    }
                `,
                variables: {
                    input: {
                        run: run,
                        name: name,
                        address: address,
                        province: province,
                        region: region,
                        bornDate: bornDate,
                        sex: sex,
                        email: email,
                        password: password,
                        phone: phone,
                    }
                }
            })
            
        });
    } catch (error) {
        console.error('Error: ', error);
        funciono = false;
    }
    if (funciono) {
        console.log('Informacion cargada a la base de datos.');
    }
    
})