<script lang="ts">
  import { auth } from "../auth.svelte";

  const handleLogOutButtonClick = () => {
    auth.loggedIn = false;
  };
</script>

<h2>Settings</h2>
<p>You passed the <code>beforeLoad</code> guard — you are logged in.</p>
<button onclick={handleLogOutButtonClick}>Log out</button>

<style>
  button {
    margin-top: 0.5rem;
    padding: 0.4rem 1rem;
    border: 1px solid #cc3333;
    background: transparent;
    color: #cc3333;
    border-radius: 5px;
    cursor: pointer;
  }

  button:hover {
    background: #cc3333;
    color: #fff;
  }
</style>
