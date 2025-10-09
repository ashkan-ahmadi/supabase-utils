# Supabase Utils

A collection of handy Supabase examples and snippets from database migrations and SQL functions to small utilities I’ve found useful along the way.

This repo is meant to be a reference and toolbox for building with Supabase.


## Getting Started

You need the followings installed and running on your machine:
- Docker
- Supabase CLI

You can clone this repo and browse through the examples directly:

```
git clone https://github.com/ashkan-ahmadi/supabase-utils.git
cd supabase-utils
```

To run the project:
1. Copy the `.env.example` file and rename it to `.env`
1. Inside the `supabase-utils` folder, run this command to start Supabase:

```
supabase start && supabase functions serve --env-file .env
```

## Contributing

Pull requests are welcome! If you’d like to share a useful snippet, migration, or utility, feel free to open a PR. Make sure your PR covers only one topic and not many different things at once so it's manageable.

## Issues

If you run into a problem, have a question, or notice something missing, please [open an issue](https://github.com/ashkan-ahmadi/supabase-utils/issues).

I’ll do my best to respond, and contributions from the community are always encouraged.

## DISCLAIMER

I’ve done my best to cover the basics of data security in these examples, but I can’t take responsibility for how the code is used in your projects. Please do your own research and adapt the snippets to fit your specific context and application to ensure they’re safe and appropriate.