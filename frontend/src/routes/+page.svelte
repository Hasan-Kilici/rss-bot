<ModeWatcher />
<div class="flex min-h-screen w-full items-center justify-center flex-col p-4">
<Card.Root class="w-[50%] overflow-hidden">
    <Card.Header class="border-b bg-primary-foreground text-primary px-4 py-2">
        <h1 class="text-xl font-semibold">Add Feed</h1>
    </Card.Header>
    <Card.Content>
        <div class="grid w-full items-center gap-4">
            <div class="flex flex-col space-y-1.5">
                <Label class="font-semibold" for="rss">Title</Label>
                <Input name="rss" bind:value={title} placeholder="Title"/>
            </div>
            <div class="flex flex-col space-y-1.5">
                <Label class="font-semibold" for="rss">Feed Url</Label>
                <Input name="rss" bind:value={feedUrl} placeholder="Feed Url"/>
            </div>
            <div class="flex flex-col space-y-1.5">
                <Label class="font-semibold" for="channelId">Channel</Label>
                <Select.Root onSelectedChange={(v) => channelId = v?.value} class="rounded-2xl">
                    <Select.Trigger >
                        <Select.Value placeholder="Select Channel" />
                    </Select.Trigger>
                    <Select.Content>
                        {#each channels as channel}
                            <Select.Item value={channel.id}>
                                <h1>{channel.name}</h1>
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>
        </div>
        <button class="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-2xl w-full" on:click={createFeed}>Add Feed</button>
    </Card.Content>
</Card.Root>
<div class="w-[50%] mt-4">
<Input placeholder="Search" class="rounded-2xl w-full mb-2" bind:value={search} on:input={updateFilteredFeeds}/>
<Table.Root class="rounded-2xl overflow-hidden">
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-[100px]">Title</Table.Head>
        <Table.Head>Url</Table.Head>
        <Table.Head>Channel</Table.Head>
        <Table.Head class="text-right">Delete</Table.Head>
        <Table.Head class="text-right">Edit</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each filtered as feed}
        <Table.Row>
            {#if feed.id === editId}
                <Table.Cell>
                    <Input bind:value={editTitle} placeholder={feed.title}/>
                </Table.Cell>
                <Table.Cell>
                    <Input bind:value={editFeedUrl} placeholder={feed.url}/>
                </Table.Cell>
                <Table.Cell>
                    <Select.Root placeholder={channels.find(channel => channel.id === feed.channelId)?.name || "Unknown"} onSelectedChange={(v) => editChannelId = v?.value} class="rounded-2xl">
                        <Select.Trigger >
                            <Select.Value placeholder="Select Channel" />
                        </Select.Trigger>
                        <Select.Content>
                            {#each channels as channel}
                                <Select.Item value={channel.id}>
                                    <h1>{channel.name}</h1>
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </Table.Cell>
                <Table.Cell class="text-right">
                    <button class="p-1 text-blue-500 rounded-md" on:click={() => editRow(null)}>
                        <Icon icon="si:close-line" width="24" height="24" />
                    </button>
                </Table.Cell>
                <Table.Cell class="text-right" on:click={editFeed}>
                    <button class="p-2 text-blue-500 rounded-2xl bg-primary text-primary-foreground">
                        Submit
                    </button>
                </Table.Cell>
            {:else}
            <Table.Cell>{feed.title}</Table.Cell>
            <Table.Cell class="font-medium">{feed.url}</Table.Cell>
            <Table.Cell><span class="rounded-2xl p-1 bg-slate-800 text-slate-500">#{channels.find(channel => channel.id === feed.channelId)?.name || "Unknown"}</span></Table.Cell>
            <Table.Cell class="text-right">
                <button class="p-1 text-red-500 rounded-md" on:click={() => deleteFeed(feed.id)}>
                    <Icon icon="si:archive-alt-duotone" width="24" height="24" />
                </button>
            </Table.Cell>
            <Table.Cell class="text-right" on:click={()=> {editRow(feed.id)}}>
                <button class="p-1 text-blue-500 rounded-md">
                    <Icon icon="si:edit-detailed-alt-duotone" width="24" height="24" />
                </button>
            </Table.Cell>
            {/if}
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
  </div>
</div>
<script>
    import { ModeWatcher } from "mode-watcher";
    import * as Select from "$lib/components/ui/select";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label} from "$lib/components/ui/label";
    import * as Table from "$lib/components/ui/table";
    import Icon from '@iconify/svelte';

    let channelId = null;
    let feeds = [];
    let channels = [];
    let feedUrl = "";
    let search = "";
    let filtered = [];
    let title = "";

    let editId = null;
    let editFeedUrl = "";
    let editChannelId = null;
    let editTitle = "";

    fetch("http://localhost:3000/feeds/channels")
        .then((res) => res.json())
        .then((data) => {
            channels = data;
    });

    fetch("http://localhost:3000/feeds")
        .then((res) => res.json())
        .then((data) => {
            feeds = data;
            filtered = data
    });

    function levenshtein(a, b) {
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let matrix = Array(a.length + 1)
            .fill(null)
            .map(() => Array(b.length + 1).fill(null));

        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1, 
                    matrix[i][j - 1] + 1, 
                    matrix[i - 1][j - 1] + cost 
                );
            }
        }
        return matrix[a.length][b.length];
    }

    function updateFilteredFeeds() {
        if (!search.trim()) {
            filtered = feeds;
        } else {
            filtered = feeds
                .map(feed => ({
                    ...feed,
                    score: levenshtein(search.toLowerCase(), feed.title.toLowerCase())
                }))
                .sort((a, b) => a.score - b.score)
                .filter(feed => feed.score < 7);
        }
    }

    async function editFeed() {
        const response = await fetch(`http://localhost:3000/feeds/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: editTitle,
                feedUrl: editFeedUrl,
                channelId: editChannelId
             })
        });

        feeds = feeds.map(feed => {
            if (feed.id == editId) {
                return {
                    ...feed,
                    title: editTitle,
                    feedUrl: editFeedUrl,
                    channelId: editChannelId
                };
            }
            return feed;
        });

        filtered = feeds;
        editId = null;

        return response.json();
    }

    async function deleteFeed(id) {
        const response = await fetch(`http://localhost:3000/feeds/${id}`, {
            method: 'DELETE'
        });
        filtered = filtered.filter(feed => feed.id !== id);
        return response.json();
    }

    async function createFeed() {
    const response = await fetch("http://localhost:3000/feeds", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title: title, 
            url: feedUrl, 
            channelId: channelId 
        })
    });

    feeds = [
        ...feeds,
        {
            title,
            url: feedUrl,
            channelId,
            id: feeds.length + 1
        }
    ];

    filtered = feeds;
    return response.json();
}

function editRow(id) {
    if (editId) {
        editId = null;
    } else {
        editId = id;
    }
}
</script>
