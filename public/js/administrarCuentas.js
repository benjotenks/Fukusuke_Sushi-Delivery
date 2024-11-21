async function getAccountByRun() {
    run = document.getElementById('runAdmin').value;
    if (!User.get("UserType") == "admin") {
        console.log("No eres admin");
        alert("No tienes permisos para realizar esta acción");
        return;
    }
    if (User.get("UserRun") == run) {
        console.log("No puedes administrate a ti mismo aqui");
        alert("No puedes administrate a ti mismo aqui");
        return;
    }
    if (run == "") {
        console.log("Ingrese un run");
        alert("Ingrese un run");
        return;
    }

    const response = await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query:`
                query getUserByRun($run: String!) {
                    getUserByRun(run: $run) {
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
                        type
                    }}`,
                    variables: {
                        run: run,
                    },
        })
    });

    const result = await response.json();
    data = result.data.getUserByRun;
    if (!data) {
        console.log("No se encontró el usuario");
        alert("No se encontró el usuario");
        return;
    }
    administradorActiveAccount = Object.entries(data);
    changeAdministratorModal(data);

}