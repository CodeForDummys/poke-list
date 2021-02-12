<script>
    const pokeApi     = 'https://pokeapi.co/api/v2/pokemon/';
    const pokeApiDesc = 'https://pokeapi.co/api/v2/pokemon-species/';
    const missingName = 'MissingNo';
    const missingImg  = 'images/missingno.png'; 

    const types = {
        normal: '#aa9',
        fire: '#f42',
        water: '#39f',
        electric: '#fc3',
        grass: '#7c5',
        ice: '#6cf',
        fighting: '#b54',
        poison: '#a59',
        ground: '#db5',
        flayin: '#89f',
        psychic: '#f59',
        bug: '#ab2',
        rock: '#ba6',
        ghost: '#66b',
        dragon: '#76e',
        dark: '#754',
        steel: '#aab',
        fairy: '#e9e'
    }

    export let id = 25;
    
    let currentPkmn;

    let isValid = false;
    
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    
    const search = async (type, pkmn) => {
        return fetch(`${type}${pkmn}/`).then(res => res.json());
    }

    const getTypes = (types) => {
        let t = [];

        types.forEach(e => {
            t.push(e.type.name);
        });
        return t;
    }

    const getDescr = (lang) => {
        let l = [];

        lang.forEach(e => {
            if(e.language.name == "es") {
                l.push(e.flavor_text);
            }
        });

        let random = Math.floor(Math.random() * l.length);

        return l[random];
    }
    
    const searchPkmn = async (pkmn) => {
        try {
            const data   = await search(pokeApi,     pkmn);
            const specie = await search(pokeApiDesc, pkmn);
        
            currentPkmn = {
                id: zeroPad(data.id, 3),
                name: data.name,
                height: data.height/10 + ' m',
                weight: data.weight/10 + ' Kg',
                types: getTypes(data.types),
                sprites : {
                    front : data.sprites.front_default,
                    back : data.sprites.back_default,
                    front_f : data.sprites.front_female,
                    back_f : data.sprites.back_female,
                    front_s : data.sprites.front_shiny,
                    back_s : data.sprites.back_shiny,
                    front_s_f : data.sprites.front_shiny_female,
                    back_s_f : data.sprites.back_shiny_female,
                    hd : data.sprites.other['official-artwork'].front_default
                },
                color : specie.color.name,
                category : specie.genera[5].genus.slice(8),
                description : getDescr(specie.flavor_text_entries)
            }
            console.log(data);
            isValid = true;
        } catch(err) {
            currentPkmn = err;
            isValid = false;
        }
    }
    
    searchPkmn(id);
</script>
    

<div class="card">
{#if isValid}
    <div class="name">
        <h5>{currentPkmn.name}</h5>
    </div>
    <div class="box-img">
        <img src="{currentPkmn.sprites.hd}" alt="{currentPkmn.name}">
        <img class="img" src="{currentPkmn.sprites.front}" alt="{currentPkmn.name}">
    </div>
    <div class="box-info">
        <p class="id">N.º{currentPkmn.id}</p>
        <p class="category">{currentPkmn.category}</p>
    </div>

    <div class="types">
    {#each currentPkmn.types as type}
        <p class="type" style="background-color: {types[type]}">{type} </p>
    {/each}
    </div>

    <!-- <p>color: {currentPkmn.color}</p> -->
    <p class="description">{currentPkmn.description}</p>
    <div class="bottom">
        <p>{currentPkmn.height}</p>
        <p>{currentPkmn.weight}</p>   
    </div>   
{/if}
</div>

<style>
    .card {
        background-color: #234;
        height: 335px;
        width: 200px;
        border-radius: 5px;
        padding: 5px 15px;
        border: 3px solid goldenrod;
    }
    .box-img {
        border-radius: 2px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
		width: 100%;
		height: auto;
        background-color: #eee;
        border: 4px solid goldenrod;
        position: relative;
	}
	img {
		box-sizing: border-box;
		width: 80%;
	}
    .img {
        position: absolute;
        z-index: -1;
    }
    .img:hover {
        z-index: 10;
    }

    p, h5 {
        color: #fff;
        margin: 0;
    }
    .name {
        text-transform: uppercase;
        margin-bottom: 5px;
    }
    .box-info {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        text-transform: uppercase;
        font-size: .8rem;
    }
    .id {
        color: #bbb;
    }
    .types {
        display: flex;
        justify-content: start;
        margin-top: 5px;
    }
    .type {
        width: 56px;
        /* height: 20px; */
        padding: 0;
        margin: 0;
        margin-right: 5px;
        border: 1px solid #a3a3a3;
        border-radius: 4px;
        /* border: 1px solid rgba(0,0,0,0.2); */
        font-size: .65rem;
        font-weight: normal;
        line-height: 1.1rem;
        text-align: center;
        text-shadow: 1px 1px 2px rgb(0 0 0 / 70%);
        text-transform: uppercase;
        transition: opacity .4s;
    }

    .description {
        background-color: violet;
        margin-top: 5px;
        color: #333;
        background-color: #def;
        border-radius: 3px;
        height: 90px;
        padding: 4px;
        font-size: .65rem;
    }


    .bottom {
        margin-top: 5px;
        display: flex;
        justify-content: space-around;
        font-size: .75rem;
    }

</style>