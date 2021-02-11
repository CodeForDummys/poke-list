<script>
import { onMount } from "svelte";
import { each } from "svelte/internal";

	let currentPkmn;
	let pkmnName;
	let img = '';
	let isValid = false;

	let all = '?limit=10220';
	
	const pokeApi = 'https://pokeapi.co/api/v2/pokemon';
	// const pokeApi = 'https://pokeapi.co/api/v2/pokemon/45/';

	const searchPkmn = async (pkmn) => {
		try {
			await fetch(`${pokeApi}/${pkmn}/`)
			.then(r => r.json())
			.then(data => {
				currentPkmn = data;
				console.log(currentPkmn);
				isValid = true;
			});
		} catch(err) {
			currentPkmn = err;
			isValid = false;
		}
	}
	
	// console.log(currentPkmn);
</script>


<h1>Pokemon elegido</h1>
<form on:submit|preventDefault="{searchPkmn(pkmnName.toLowerCase())}">
<input bind:value="{pkmnName}"  type="text">
<button>buscar</button>

<!-- {#each currentPkmn as pkmn}
	{console.log(pkmn)}
{/each} -->
{#if isValid}
	<div class="box-img">
		{#if currentPkmn.sprites.front_default != null}
			<img src="{currentPkmn.sprites.front_default}" alt="{currentPkmn.name}">
			<img src="{currentPkmn.sprites.back_default}" alt="{currentPkmn.name}">
			<img src="{currentPkmn.sprites.front_shiny}" alt="{currentPkmn.name}">
			<img src="{currentPkmn.sprites.back_shiny}" alt="{currentPkmn.name}">
		{:else}
			<img src="{currentPkmn.sprites.other['official-artwork'].front_default}" alt="{currentPkmn.name}">
		{/if}
		
	</div>
	<p>{currentPkmn.name}</p>
{:else}
	<p>Pokemon no encontrado</p>
{/if}
</form>

<style>
h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	.box-img {
		display: flex;
		width: 100%;
		height: 200px;
	}
	img {
		box-sizing: border-box;
		width: 200px;
	}


</style>