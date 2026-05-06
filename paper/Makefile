MAIN    := open-gap
LATEX   := pdflatex
BIBTEX  := bibtex
OUT     := $(MAIN).pdf

.PHONY: pdf clean distclean watch

pdf: $(OUT)

$(OUT): $(MAIN).tex bibliography.bib
	$(LATEX) -interaction=nonstopmode $(MAIN).tex
	$(BIBTEX) $(MAIN)
	$(LATEX) -interaction=nonstopmode $(MAIN).tex
	$(LATEX) -interaction=nonstopmode $(MAIN).tex

clean:
	rm -f $(MAIN).aux $(MAIN).log $(MAIN).bbl $(MAIN).blg $(MAIN).out $(MAIN).toc

distclean: clean
	rm -f $(OUT)

watch:
	@echo "Rebuilding on change. Requires fswatch (brew install fswatch)."
	@fswatch -o $(MAIN).tex bibliography.bib | xargs -n1 -I{} make pdf
