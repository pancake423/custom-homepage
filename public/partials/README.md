# Idea

these files serve a similar purpose to JSX- sometimes you need to write a lot of HTML for a component,
and doing it in JavaScript with a bunch of createElement(), appendChild(), element.className, etc. calls
can get annoying (especially if that HTML is totally static). Instead, we can just write that HTML in a 
separate file and then load it with fetch().

The idea is also loosely inspired by Laravel's Blade components, where you can write subcomponents in a separate 
file and then inline them.

It doesn't seem to save too much effort after experimenting (in practice, I ended up still having to hook in to a bunch of the elements that I though would be static), but it was a fun idea.
